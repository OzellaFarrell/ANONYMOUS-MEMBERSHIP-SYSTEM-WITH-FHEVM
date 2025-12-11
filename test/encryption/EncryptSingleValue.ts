import { expect } from "chai";
import { ethers } from "hardhat";
import type { EncryptSingleValue } from "../../typechain-types";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Test Suite: EncryptSingleValue Contract
 *
 * Tests single encrypted value storage and management.
 * Demonstrates:
 * - Correct encrypted input handling
 * - FHE.fromExternal() with proof validation
 * - Dual permission granting (allowThis + allow)
 * - Encrypted value retrieval
 * - Value updates with re-granting permissions
 *
 * Key Patterns:
 * - externalEuint32 → euint32 conversion
 * - Zero-knowledge proof validation
 * - Permission management on encrypted data
 */
describe("EncryptSingleValue", function () {
  let contract: EncryptSingleValue;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let contractAddress: string;

  /**
   * Deploy contract before each test
   */
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const EncryptSingleValueFactory = await ethers.getContractFactory(
      "EncryptSingleValue"
    );
    contract = await EncryptSingleValueFactory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  /**
   * Test 1: Contract deployment
   * Verifies contract deploys successfully
   */
  it("should deploy successfully", async function () {
    expect(await contract.getAddress()).to.be.properAddress;
  });

  /**
   * Test 2: Store encrypted secret
   * Tests the core pattern of storing a single encrypted value
   *
   * Pattern demonstrated:
   * 1. Create encrypted input with createEncryptedInput
   * 2. Add value with add32()
   * 3. Encrypt to get handle and proof
   * 4. Submit to contract with FHE.fromExternal
   * 5. Contract stores and grants permissions
   */
  it("should store encrypted secret", async function () {
    // Create encrypted input bound to [contract, user1]
    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add32(12345); // Secret value: 12345
    const encrypted = await input.encrypt();

    // Store secret
    const tx = await contract
      .connect(user1)
      .storeSecret(encrypted.handles[0], encrypted.inputProof);
    await tx.wait();

    // Verify secret is stored
    expect(await contract.userHasSecret(user1.address)).to.be.true;
  });

  /**
   * Test 3: Retrieve encrypted secret
   * Tests retrieval of stored encrypted value
   */
  it("should retrieve encrypted secret", async function () {
    // Store secret first
    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add32(99999);
    const encrypted = await input.encrypt();

    await contract
      .connect(user1)
      .storeSecret(encrypted.handles[0], encrypted.inputProof);

    // Retrieve encrypted secret
    const secret = await contract.connect(user1).getSecret();

    // Secret exists (encrypted, not plaintext)
    expect(secret).to.not.be.undefined;
  });

  /**
   * Test 4: Event emission
   * Verifies SecretStored event is emitted with correct parameters
   */
  it("should emit SecretStored event", async function () {
    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add32(777);
    const encrypted = await input.encrypt();

    await expect(
      contract
        .connect(user1)
        .storeSecret(encrypted.handles[0], encrypted.inputProof)
    )
      .to.emit(contract, "SecretStored")
      .withArgs(user1.address);
  });

  /**
   * Test 5: Prevent duplicate storage
   * Tests that users cannot store multiple secrets without updating
   */
  it("should reject storing secret twice", async function () {
    // Store first secret
    const input1 = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input1.add32(111);
    const encrypted1 = await input1.encrypt();
    await contract
      .connect(user1)
      .storeSecret(encrypted1.handles[0], encrypted1.inputProof);

    // Try to store second secret - should fail
    const input2 = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input2.add32(222);
    const encrypted2 = await input2.encrypt();

    await expect(
      contract
        .connect(user1)
        .storeSecret(encrypted2.handles[0], encrypted2.inputProof)
    ).to.be.revertedWith("EncryptSingleValue: secret already stored");
  });

  /**
   * Test 6: Multiple users
   * Tests that multiple users can store secrets independently
   */
  it("should allow multiple users to store secrets", async function () {
    // User1 stores secret
    const input1 = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input1.add32(1000);
    const encrypted1 = await input1.encrypt();
    await contract
      .connect(user1)
      .storeSecret(encrypted1.handles[0], encrypted1.inputProof);

    // User2 stores secret
    const input2 = await (user2 as any).createEncryptedInput(
      contractAddress,
      user2.address
    );
    input2.add32(2000);
    const encrypted2 = await input2.encrypt();
    await contract
      .connect(user2)
      .storeSecret(encrypted2.handles[0], encrypted2.inputProof);

    // Both should have secrets
    expect(await contract.userHasSecret(user1.address)).to.be.true;
    expect(await contract.userHasSecret(user2.address)).to.be.true;
  });

  /**
   * Test 7: Update secret
   * Tests updating existing encrypted secret
   *
   * Key pattern: Permissions must be re-granted after update
   */
  it("should update existing secret", async function () {
    // Store initial secret
    const input1 = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input1.add32(100);
    const encrypted1 = await input1.encrypt();
    await contract
      .connect(user1)
      .storeSecret(encrypted1.handles[0], encrypted1.inputProof);

    // Update secret
    const input2 = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input2.add32(200);
    const encrypted2 = await input2.encrypt();
    await contract
      .connect(user1)
      .updateSecret(encrypted2.handles[0], encrypted2.inputProof);

    // Should still have secret
    expect(await contract.userHasSecret(user1.address)).to.be.true;

    // Should be able to retrieve updated secret
    const updatedSecret = await contract.connect(user1).getSecret();
    expect(updatedSecret).to.not.be.undefined;
  });

  /**
   * Test 8: Update without existing secret
   * Tests that update fails if no secret exists
   */
  it("should reject update without existing secret", async function () {
    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add32(500);
    const encrypted = await input.encrypt();

    await expect(
      contract
        .connect(user1)
        .updateSecret(encrypted.handles[0], encrypted.inputProof)
    ).to.be.revertedWith("EncryptSingleValue: no secret stored");
  });

  /**
   * Test 9: Get secret without storing
   * Tests that retrieval fails if no secret stored
   */
  it("should reject getting secret without storing first", async function () {
    await expect(contract.connect(user1).getSecret()).to.be.revertedWith(
      "EncryptSingleValue: no secret stored"
    );
  });

  /**
   * Test 10: User has secret check
   * Tests the userHasSecret function for different users
   */
  it("should correctly report secret existence", async function () {
    expect(await contract.userHasSecret(user1.address)).to.be.false;

    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add32(999);
    const encrypted = await input.encrypt();
    await contract
      .connect(user1)
      .storeSecret(encrypted.handles[0], encrypted.inputProof);

    expect(await contract.userHasSecret(user1.address)).to.be.true;
    expect(await contract.userHasSecret(user2.address)).to.be.false;
  });

  /**
   * Test 11: Zero value secret
   * Tests storing encrypted zero value
   */
  it("should handle zero value secret", async function () {
    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add32(0); // Zero value
    const encrypted = await input.encrypt();

    const tx = await contract
      .connect(user1)
      .storeSecret(encrypted.handles[0], encrypted.inputProof);
    await tx.wait();

    expect(await contract.userHasSecret(user1.address)).to.be.true;
  });

  /**
   * Test 12: Maximum value secret
   * Tests storing maximum uint32 value
   */
  it("should handle maximum value secret", async function () {
    const maxValue = 0xffffffff; // Max uint32

    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add32(maxValue);
    const encrypted = await input.encrypt();

    const tx = await contract
      .connect(user1)
      .storeSecret(encrypted.handles[0], encrypted.inputProof);
    await tx.wait();

    expect(await contract.userHasSecret(user1.address)).to.be.true;
  });

  /**
   * Test 13: Multiple updates
   * Tests multiple sequential updates to the same secret
   */
  it("should handle multiple updates", async function () {
    // Initial store
    const input1 = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input1.add32(100);
    const encrypted1 = await input1.encrypt();
    await contract
      .connect(user1)
      .storeSecret(encrypted1.handles[0], encrypted1.inputProof);

    // First update
    const input2 = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input2.add32(200);
    const encrypted2 = await input2.encrypt();
    await contract
      .connect(user1)
      .updateSecret(encrypted2.handles[0], encrypted2.inputProof);

    // Second update
    const input3 = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input3.add32(300);
    const encrypted3 = await input3.encrypt();
    await contract
      .connect(user1)
      .updateSecret(encrypted3.handles[0], encrypted3.inputProof);

    expect(await contract.userHasSecret(user1.address)).to.be.true;
  });

  /**
   * Test 14: Update emits event
   * Verifies that updateSecret also emits SecretStored event
   */
  it("should emit event on update", async function () {
    // Store initial
    const input1 = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input1.add32(100);
    const encrypted1 = await input1.encrypt();
    await contract
      .connect(user1)
      .storeSecret(encrypted1.handles[0], encrypted1.inputProof);

    // Update and check event
    const input2 = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input2.add32(200);
    const encrypted2 = await input2.encrypt();

    await expect(
      contract
        .connect(user1)
        .updateSecret(encrypted2.handles[0], encrypted2.inputProof)
    )
      .to.emit(contract, "SecretStored")
      .withArgs(user1.address);
  });

  /**
   * Test 15: Privacy verification
   * Verifies that encrypted secret doesn't reveal plaintext
   */
  it("should not reveal plaintext value", async function () {
    const plaintextValue = 123456;

    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add32(plaintextValue);
    const encrypted = await input.encrypt();

    await contract
      .connect(user1)
      .storeSecret(encrypted.handles[0], encrypted.inputProof);

    const secret = await contract.connect(user1).getSecret();

    // Secret is encrypted handle, not plaintext
    expect(secret).to.not.equal(plaintextValue);
  });
});
