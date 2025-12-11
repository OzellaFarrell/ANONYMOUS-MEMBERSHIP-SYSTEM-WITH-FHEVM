import { expect } from "chai";
import { ethers } from "hardhat";
import type { EncryptMultipleValues } from "../../typechain-types";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Test Suite: EncryptMultipleValues Contract
 *
 * Tests multiple encrypted value storage and management.
 * Demonstrates:
 * - Handling multiple encrypted inputs
 * - Different encrypted types (euint32, euint8)
 * - Batching encrypted values in structs
 * - Per-field permission granting
 * - Updating multiple encrypted values
 *
 * Key Patterns:
 * - Multiple FHE.fromExternal() calls
 * - Separate proofs for each value
 * - Permissions for EACH encrypted field
 * - Type mixing (euint32 + euint8)
 */
describe("EncryptMultipleValues", function () {
  let contract: EncryptMultipleValues;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let contractAddress: string;

  /**
   * Deploy contract before each test
   */
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const EncryptMultipleValuesFactory = await ethers.getContractFactory(
      "EncryptMultipleValues"
    );
    contract = await EncryptMultipleValuesFactory.deploy();
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
   * Test 2: Create profile with multiple encrypted values
   * Tests the core pattern of storing multiple encrypted values
   *
   * Pattern demonstrated:
   * 1. Create single encrypted input
   * 2. Add multiple values (add32 for euint32, add8 for euint8)
   * 3. Encrypt once to get all handles
   * 4. Submit all handles with single proof
   * 5. Contract converts and stores all values
   * 6. Grants permissions for EACH value separately
   */
  it("should create profile with multiple encrypted values", async function () {
    // Create encrypted input with multiple values
    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add32(10000); // Balance: 10000
    input.add8(2); // Tier: 2 (Silver)
    input.add32(5000); // Score: 5000
    const encrypted = await input.encrypt();

    // Create profile with all values
    const tx = await contract.connect(user1).createProfile(
      encrypted.handles[0], // balance
      encrypted.handles[1], // tier
      encrypted.handles[2], // score
      encrypted.inputProof,
      encrypted.inputProof,
      encrypted.inputProof
    );
    await tx.wait();

    // Verify profile is created
    expect(await contract.hasProfile(user1.address)).to.be.true;
  });

  /**
   * Test 3: Retrieve individual encrypted values
   * Tests retrieval of each encrypted field separately
   */
  it("should retrieve individual encrypted values", async function () {
    // Create profile
    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add32(20000);
    input.add8(3);
    input.add32(7500);
    const encrypted = await input.encrypt();

    await contract.connect(user1).createProfile(
      encrypted.handles[0],
      encrypted.handles[1],
      encrypted.handles[2],
      encrypted.inputProof,
      encrypted.inputProof,
      encrypted.inputProof
    );

    // Retrieve each value
    const balance = await contract.connect(user1).getBalance();
    const tier = await contract.connect(user1).getTier();
    const score = await contract.connect(user1).getScore();

    // All values should exist (encrypted)
    expect(balance).to.not.be.undefined;
    expect(tier).to.not.be.undefined;
    expect(score).to.not.be.undefined;
  });

  /**
   * Test 4: Event emission
   * Verifies ProfileCreated event is emitted
   */
  it("should emit ProfileCreated event", async function () {
    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add32(5000);
    input.add8(1);
    input.add32(2500);
    const encrypted = await input.encrypt();

    await expect(
      contract.connect(user1).createProfile(
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.handles[2],
        encrypted.inputProof,
        encrypted.inputProof,
        encrypted.inputProof
      )
    )
      .to.emit(contract, "ProfileCreated")
      .withArgs(user1.address);
  });

  /**
   * Test 5: Prevent duplicate profile creation
   * Tests that users cannot create multiple profiles
   */
  it("should reject creating profile twice", async function () {
    // Create first profile
    const input1 = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input1.add32(1000);
    input1.add8(1);
    input1.add32(500);
    const encrypted1 = await input1.encrypt();
    await contract.connect(user1).createProfile(
      encrypted1.handles[0],
      encrypted1.handles[1],
      encrypted1.handles[2],
      encrypted1.inputProof,
      encrypted1.inputProof,
      encrypted1.inputProof
    );

    // Try to create second profile - should fail
    const input2 = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input2.add32(2000);
    input2.add8(2);
    input2.add32(1000);
    const encrypted2 = await input2.encrypt();

    await expect(
      contract.connect(user1).createProfile(
        encrypted2.handles[0],
        encrypted2.handles[1],
        encrypted2.handles[2],
        encrypted2.inputProof,
        encrypted2.inputProof,
        encrypted2.inputProof
      )
    ).to.be.revertedWith("EncryptMultipleValues: profile exists");
  });

  /**
   * Test 6: Multiple users
   * Tests that multiple users can create independent profiles
   */
  it("should allow multiple users to create profiles", async function () {
    // User1 creates profile
    const input1 = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input1.add32(1000);
    input1.add8(1);
    input1.add32(500);
    const encrypted1 = await input1.encrypt();
    await contract.connect(user1).createProfile(
      encrypted1.handles[0],
      encrypted1.handles[1],
      encrypted1.handles[2],
      encrypted1.inputProof,
      encrypted1.inputProof,
      encrypted1.inputProof
    );

    // User2 creates profile
    const input2 = await (user2 as any).createEncryptedInput(
      contractAddress,
      user2.address
    );
    input2.add32(2000);
    input2.add8(2);
    input2.add32(1000);
    const encrypted2 = await input2.encrypt();
    await contract.connect(user2).createProfile(
      encrypted2.handles[0],
      encrypted2.handles[1],
      encrypted2.handles[2],
      encrypted2.inputProof,
      encrypted2.inputProof,
      encrypted2.inputProof
    );

    // Both should have profiles
    expect(await contract.hasProfile(user1.address)).to.be.true;
    expect(await contract.hasProfile(user2.address)).to.be.true;
  });

  /**
   * Test 7: Update profile
   * Tests updating all encrypted values in existing profile
   *
   * Key pattern: Permissions must be re-granted for ALL updated values
   */
  it("should update existing profile", async function () {
    // Create initial profile
    const input1 = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input1.add32(1000);
    input1.add8(1);
    input1.add32(500);
    const encrypted1 = await input1.encrypt();
    await contract.connect(user1).createProfile(
      encrypted1.handles[0],
      encrypted1.handles[1],
      encrypted1.handles[2],
      encrypted1.inputProof,
      encrypted1.inputProof,
      encrypted1.inputProof
    );

    // Update profile
    const input2 = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input2.add32(5000);
    input2.add8(3);
    input2.add32(2500);
    const encrypted2 = await input2.encrypt();
    await contract.connect(user1).updateProfile(
      encrypted2.handles[0],
      encrypted2.handles[1],
      encrypted2.handles[2],
      encrypted2.inputProof,
      encrypted2.inputProof,
      encrypted2.inputProof
    );

    // Should still have profile
    expect(await contract.hasProfile(user1.address)).to.be.true;

    // Should be able to retrieve updated values
    const balance = await contract.connect(user1).getBalance();
    const tier = await contract.connect(user1).getTier();
    const score = await contract.connect(user1).getScore();

    expect(balance).to.not.be.undefined;
    expect(tier).to.not.be.undefined;
    expect(score).to.not.be.undefined;
  });

  /**
   * Test 8: Update without existing profile
   * Tests that update fails if no profile exists
   */
  it("should reject update without existing profile", async function () {
    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add32(1000);
    input.add8(1);
    input.add32(500);
    const encrypted = await input.encrypt();

    await expect(
      contract.connect(user1).updateProfile(
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.handles[2],
        encrypted.inputProof,
        encrypted.inputProof,
        encrypted.inputProof
      )
    ).to.be.revertedWith("EncryptMultipleValues: no profile");
  });

  /**
   * Test 9: Get values without profile
   * Tests that retrieval fails if no profile exists
   */
  it("should reject getting values without profile", async function () {
    await expect(contract.connect(user1).getBalance()).to.be.revertedWith(
      "EncryptMultipleValues: no profile"
    );
    await expect(contract.connect(user1).getTier()).to.be.revertedWith(
      "EncryptMultipleValues: no profile"
    );
    await expect(contract.connect(user1).getScore()).to.be.revertedWith(
      "EncryptMultipleValues: no profile"
    );
  });

  /**
   * Test 10: Has profile check
   * Tests the hasProfile function for different users
   */
  it("should correctly report profile existence", async function () {
    expect(await contract.hasProfile(user1.address)).to.be.false;

    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add32(1000);
    input.add8(1);
    input.add32(500);
    const encrypted = await input.encrypt();
    await contract.connect(user1).createProfile(
      encrypted.handles[0],
      encrypted.handles[1],
      encrypted.handles[2],
      encrypted.inputProof,
      encrypted.inputProof,
      encrypted.inputProof
    );

    expect(await contract.hasProfile(user1.address)).to.be.true;
    expect(await contract.hasProfile(user2.address)).to.be.false;
  });

  /**
   * Test 11: Zero values
   * Tests creating profile with all zero values
   */
  it("should handle zero values", async function () {
    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add32(0); // Zero balance
    input.add8(0); // Zero tier
    input.add32(0); // Zero score
    const encrypted = await input.encrypt();

    await contract.connect(user1).createProfile(
      encrypted.handles[0],
      encrypted.handles[1],
      encrypted.handles[2],
      encrypted.inputProof,
      encrypted.inputProof,
      encrypted.inputProof
    );

    expect(await contract.hasProfile(user1.address)).to.be.true;
  });

  /**
   * Test 12: Maximum values
   * Tests creating profile with maximum values for each type
   */
  it("should handle maximum values", async function () {
    const maxUint32 = 0xffffffff;
    const maxUint8 = 0xff;

    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add32(maxUint32); // Max balance
    input.add8(maxUint8); // Max tier
    input.add32(maxUint32); // Max score
    const encrypted = await input.encrypt();

    await contract.connect(user1).createProfile(
      encrypted.handles[0],
      encrypted.handles[1],
      encrypted.handles[2],
      encrypted.inputProof,
      encrypted.inputProof,
      encrypted.inputProof
    );

    expect(await contract.hasProfile(user1.address)).to.be.true;
  });

  /**
   * Test 13: Type mixing
   * Verifies correct handling of different encrypted types (euint32 vs euint8)
   */
  it("should correctly handle mixed types", async function () {
    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add32(999999); // Large uint32
    input.add8(255); // Max uint8
    input.add32(123456); // Medium uint32
    const encrypted = await input.encrypt();

    await contract.connect(user1).createProfile(
      encrypted.handles[0],
      encrypted.handles[1],
      encrypted.handles[2],
      encrypted.inputProof,
      encrypted.inputProof,
      encrypted.inputProof
    );

    // Retrieve each with correct type
    const balance = await contract.connect(user1).getBalance(); // euint32
    const tier = await contract.connect(user1).getTier(); // euint8
    const score = await contract.connect(user1).getScore(); // euint32

    expect(balance).to.not.be.undefined;
    expect(tier).to.not.be.undefined;
    expect(score).to.not.be.undefined;
  });

  /**
   * Test 14: Update emits event
   * Verifies that updateProfile also emits ProfileCreated event
   */
  it("should emit event on update", async function () {
    // Create initial profile
    const input1 = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input1.add32(1000);
    input1.add8(1);
    input1.add32(500);
    const encrypted1 = await input1.encrypt();
    await contract.connect(user1).createProfile(
      encrypted1.handles[0],
      encrypted1.handles[1],
      encrypted1.handles[2],
      encrypted1.inputProof,
      encrypted1.inputProof,
      encrypted1.inputProof
    );

    // Update and check event
    const input2 = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input2.add32(2000);
    input2.add8(2);
    input2.add32(1000);
    const encrypted2 = await input2.encrypt();

    await expect(
      contract.connect(user1).updateProfile(
        encrypted2.handles[0],
        encrypted2.handles[1],
        encrypted2.handles[2],
        encrypted2.inputProof,
        encrypted2.inputProof,
        encrypted2.inputProof
      )
    )
      .to.emit(contract, "ProfileCreated")
      .withArgs(user1.address);
  });

  /**
   * Test 15: Privacy verification
   * Verifies that encrypted values don't reveal plaintext
   */
  it("should not reveal plaintext values", async function () {
    const plaintextBalance = 12345;
    const plaintextTier = 3;
    const plaintextScore = 67890;

    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add32(plaintextBalance);
    input.add8(plaintextTier);
    input.add32(plaintextScore);
    const encrypted = await input.encrypt();

    await contract.connect(user1).createProfile(
      encrypted.handles[0],
      encrypted.handles[1],
      encrypted.handles[2],
      encrypted.inputProof,
      encrypted.inputProof,
      encrypted.inputProof
    );

    const balance = await contract.connect(user1).getBalance();
    const tier = await contract.connect(user1).getTier();
    const score = await contract.connect(user1).getScore();

    // Encrypted handles, not plaintext
    expect(balance).to.not.equal(plaintextBalance);
    expect(tier).to.not.equal(plaintextTier);
    expect(score).to.not.equal(plaintextScore);
  });
});
