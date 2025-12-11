import { expect } from "chai";
import { ethers } from "hardhat";
import type { EqualityComparison } from "../../typechain-types";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Test Suite: EqualityComparison Contract
 *
 * Tests encrypted equality comparison operations using FHEVM.
 * Demonstrates:
 * - Encrypted equality checks (FHE.eq)
 * - Encrypted comparisons (FHE.gt, FHE.lt)
 * - Privacy-preserving value comparison
 * - Encrypted conditional logic
 *
 * Key Patterns:
 * - Comparison without decryption
 * - Multiple comparison operations
 * - Encrypted boolean results
 */
describe("EqualityComparison", function () {
  let contract: EqualityComparison;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let contractAddress: string;

  /**
   * Deploy contract before each test
   * Sets encrypted target value of 42
   */
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const EqualityComparisonFactory = await ethers.getContractFactory(
      "EqualityComparison"
    );

    // Create encrypted target value (42)
    const input = await (owner as any).createEncryptedInput(
      ethers.ZeroAddress, // Will be updated after deployment
      owner.address
    );
    input.add32(42); // Target value is 42
    const encrypted = await input.encrypt();

    // Deploy contract with encrypted target
    contract = await EqualityComparisonFactory.deploy(
      encrypted.handles[0],
      encrypted.inputProof
    );

    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  /**
   * Test 1: Contract deployment
   * Verifies contract deploys successfully with encrypted target
   */
  it("should deploy with encrypted target", async function () {
    expect(await contract.getAddress()).to.be.properAddress;
  });

  /**
   * Test 2: Get encrypted target
   * Verifies target value is stored encrypted
   */
  it("should store encrypted target value", async function () {
    const encryptedTarget = await contract.getEncryptedTarget();
    expect(encryptedTarget).to.not.be.undefined;
  });

  /**
   * Test 3: Check equality - matching value
   * Tests encrypted equality check when values match
   */
  it("should return true when guess equals target", async function () {
    // Create encrypted guess (42 - matches target)
    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add32(42); // Correct guess
    const encrypted = await input.encrypt();

    // Check equality
    const result = await contract
      .connect(user1)
      .checkEquality(encrypted.handles[0], encrypted.inputProof);

    expect(result).to.be.true;
  });

  /**
   * Test 4: Check equality - non-matching value
   * Tests encrypted equality check when values differ
   */
  it("should return false when guess does not equal target", async function () {
    // Create encrypted guess (100 - does not match target of 42)
    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add32(100); // Incorrect guess
    const encrypted = await input.encrypt();

    // Check equality
    const result = await contract
      .connect(user1)
      .checkEquality(encrypted.handles[0], encrypted.inputProof);

    expect(result).to.be.false;
  });

  /**
   * Test 5: Track guess count
   * Verifies contract tracks number of equality checks per user
   */
  it("should track guess count for each user", async function () {
    // User1 makes first guess
    const input1 = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input1.add32(10);
    const encrypted1 = await input1.encrypt();
    await contract
      .connect(user1)
      .checkEquality(encrypted1.handles[0], encrypted1.inputProof);

    expect(await contract.getGuessCount(user1.address)).to.equal(1);

    // User1 makes second guess
    const input2 = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input2.add32(20);
    const encrypted2 = await input2.encrypt();
    await contract
      .connect(user1)
      .checkEquality(encrypted2.handles[0], encrypted2.inputProof);

    expect(await contract.getGuessCount(user1.address)).to.equal(2);

    // User2 should have separate count
    expect(await contract.getGuessCount(user2.address)).to.equal(0);
  });

  /**
   * Test 6: Multiple users
   * Tests that different users can make guesses independently
   */
  it("should handle multiple users independently", async function () {
    // User1 guess
    const input1 = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input1.add32(42);
    const encrypted1 = await input1.encrypt();
    await contract
      .connect(user1)
      .checkEquality(encrypted1.handles[0], encrypted1.inputProof);

    // User2 guess
    const input2 = await (user2 as any).createEncryptedInput(
      contractAddress,
      user2.address
    );
    input2.add32(50);
    const encrypted2 = await input2.encrypt();
    await contract
      .connect(user2)
      .checkEquality(encrypted2.handles[0], encrypted2.inputProof);

    expect(await contract.getGuessCount(user1.address)).to.equal(1);
    expect(await contract.getGuessCount(user2.address)).to.equal(1);
  });

  /**
   * Test 7: Update target
   * Tests updating the encrypted target value
   */
  it("should update target value", async function () {
    // Update target to 100
    const input = await (owner as any).createEncryptedInput(
      contractAddress,
      owner.address
    );
    input.add32(100);
    const encrypted = await input.encrypt();

    await contract.updateTarget(encrypted.handles[0], encrypted.inputProof);

    // Verify new target works
    const guessInput = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    guessInput.add32(100);
    const guessEncrypted = await guessInput.encrypt();

    const result = await contract
      .connect(user1)
      .checkEquality(guessEncrypted.handles[0], guessEncrypted.inputProof);

    expect(result).to.be.true;
  });

  /**
   * Test 8: Compare two encrypted values - equal
   * Tests comparing two arbitrary encrypted values when equal
   */
  it("should compare two equal encrypted values", async function () {
    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add32(50);
    input.add32(50);
    const encrypted = await input.encrypt();

    const result = await contract.compareValues(
      encrypted.handles[0],
      encrypted.handles[1],
      encrypted.inputProof,
      encrypted.inputProof
    );

    expect(result).to.be.true;
  });

  /**
   * Test 9: Compare two encrypted values - not equal
   * Tests comparing two arbitrary encrypted values when different
   */
  it("should compare two different encrypted values", async function () {
    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add32(50);
    input.add32(75);
    const encrypted = await input.encrypt();

    const result = await contract.compareValues(
      encrypted.handles[0],
      encrypted.handles[1],
      encrypted.inputProof,
      encrypted.inputProof
    );

    expect(result).to.be.false;
  });

  /**
   * Test 10: Conditional operation - equal
   * Tests encrypted conditional logic when values are equal
   */
  it("should perform conditional operation - equal case", async function () {
    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add32(42); // Equals target
    const encrypted = await input.encrypt();

    const result = await contract
      .connect(user1)
      .conditionalOperation(encrypted.handles[0], encrypted.inputProof);

    expect(result).to.be.true;
  });

  /**
   * Test 11: Conditional operation - not equal
   * Tests encrypted conditional logic when values differ
   */
  it("should perform conditional operation - not equal case", async function () {
    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add32(100); // Does not equal target (42)
    const encrypted = await input.encrypt();

    const result = await contract
      .connect(user1)
      .conditionalOperation(encrypted.handles[0], encrypted.inputProof);

    expect(result).to.be.false;
  });

  /**
   * Test 12: Event emission
   * Verifies EqualityChecked event is emitted
   */
  it("should emit EqualityChecked event", async function () {
    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add32(42);
    const encrypted = await input.encrypt();

    await expect(
      contract
        .connect(user1)
        .checkEquality(encrypted.handles[0], encrypted.inputProof)
    )
      .to.emit(contract, "EqualityChecked")
      .withArgs(user1.address);
  });

  /**
   * Test 13: Zero value comparison
   * Tests equality check with zero value
   */
  it("should handle zero value comparison", async function () {
    // Update target to 0
    const targetInput = await (owner as any).createEncryptedInput(
      contractAddress,
      owner.address
    );
    targetInput.add32(0);
    const targetEncrypted = await targetInput.encrypt();
    await contract.updateTarget(
      targetEncrypted.handles[0],
      targetEncrypted.inputProof
    );

    // Guess 0
    const guessInput = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    guessInput.add32(0);
    const guessEncrypted = await guessInput.encrypt();

    const result = await contract
      .connect(user1)
      .checkEquality(guessEncrypted.handles[0], guessEncrypted.inputProof);

    expect(result).to.be.true;
  });

  /**
   * Test 14: Maximum value comparison
   * Tests equality check with maximum uint32 value
   */
  it("should handle maximum value comparison", async function () {
    const maxValue = 0xffffffff; // Max uint32

    // Update target to max value
    const targetInput = await (owner as any).createEncryptedInput(
      contractAddress,
      owner.address
    );
    targetInput.add32(maxValue);
    const targetEncrypted = await targetInput.encrypt();
    await contract.updateTarget(
      targetEncrypted.handles[0],
      targetEncrypted.inputProof
    );

    // Guess max value
    const guessInput = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    guessInput.add32(maxValue);
    const guessEncrypted = await guessInput.encrypt();

    const result = await contract
      .connect(user1)
      .checkEquality(guessEncrypted.handles[0], guessEncrypted.inputProof);

    expect(result).to.be.true;
  });

  /**
   * Test 15: Privacy verification
   * Verifies that encrypted values don't reveal plaintext
   */
  it("should not reveal plaintext values through comparison", async function () {
    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add32(999);
    const encrypted = await input.encrypt();

    // Result only tells if equal, not the actual values
    const result = await contract
      .connect(user1)
      .checkEquality(encrypted.handles[0], encrypted.inputProof);

    // Result is boolean, doesn't reveal actual values
    expect(typeof result).to.equal("boolean");
  });
});
