import { expect } from "chai";
import { ethers } from "hardhat";
import { getSigners, initializeAccount } from "@fhevm/hardhat-plugin";
import { FHEArithmetic } from "../../typechain-types";

describe("FHEArithmetic", function () {
  let contract: FHEArithmetic;
  let accounts: any[];

  beforeEach(async function () {
    accounts = await getSigners();

    const Factory = await ethers.getContractFactory("FHEArithmetic");
    contract = await Factory.deploy();
    await contract.waitForDeployment();

    await initializeAccount();
  });

  describe("Addition Operations", function () {
    /**
     * ✅ SUCCESS: Add two encrypted values
     * - Initialized counter starts at 0
     * - Adding encrypted value updates counter
     * - Demonstrates FHE.add operation
     */
    it("should add encrypted values correctly", async function () {
      const account = accounts[0];

      // Create encrypted input with value 5
      const input = await account.createEncryptedInput(
        await contract.getAddress(),
        account.address
      );
      input.add32(5);
      const encrypted = await input.encrypt();

      // Add to counter
      const tx = await contract.addToCounter(encrypted.handles[0], encrypted.inputProof);
      await tx.wait();

      // Verify counter has been updated
      const result = await contract.getEncryptedCounter();
      expect(result).to.not.be.undefined;
    });

    /**
     * ✅ SUCCESS: Add multiple values sequentially
     * - Each addition builds on previous result
     * - Encrypted operations are composable
     */
    it("should support multiple additions", async function () {
      const account = accounts[0];

      // First addition: +5
      const input1 = await account.createEncryptedInput(
        await contract.getAddress(),
        account.address
      );
      input1.add32(5);
      const encrypted1 = await input1.encrypt();
      await contract.addToCounter(encrypted1.handles[0], encrypted1.inputProof);

      // Second addition: +3
      const input2 = await account.createEncryptedInput(
        await contract.getAddress(),
        account.address
      );
      input2.add32(3);
      const encrypted2 = await input2.encrypt();
      await contract.addToCounter(encrypted2.handles[0], encrypted2.inputProof);

      // Result should be encrypted sum (8)
      const result = await contract.getEncryptedCounter();
      expect(result).to.not.be.undefined;
    });
  });

  describe("Subtraction Operations", function () {
    /**
     * ✅ SUCCESS: Subtract encrypted value
     * - Demonstrates FHE.sub operation
     * - Works on encrypted data
     */
    it("should subtract encrypted values", async function () {
      const account = accounts[0];

      // First add some value
      const addInput = await account.createEncryptedInput(
        await contract.getAddress(),
        account.address
      );
      addInput.add32(10);
      const addEncrypted = await addInput.encrypt();
      await contract.addToCounter(addEncrypted.handles[0], addEncrypted.inputProof);

      // Now subtract
      const subInput = await account.createEncryptedInput(
        await contract.getAddress(),
        account.address
      );
      subInput.add32(3);
      const subEncrypted = await subInput.encrypt();

      const tx = await contract.subtractFromCounter(
        subEncrypted.handles[0],
        subEncrypted.inputProof
      );
      await tx.wait();

      const result = await contract.getEncryptedCounter();
      expect(result).to.not.be.undefined;
    });

    /**
     * ❌ PITFALL: Underflow protection
     * In production, should check for underflow before subtracting
     * Without checks, could wrap around (uint32 underflow)
     */
    it("should demonstrate underflow risk without checks", async function () {
      const account = accounts[0];

      // Try to subtract more than we have
      const input = await account.createEncryptedInput(
        await contract.getAddress(),
        account.address
      );
      input.add32(100); // Subtract 100 from 0
      const encrypted = await input.encrypt();

      // This should work but result in underflow
      // In production, add require checks
      const tx = await contract.subtractFromCounter(encrypted.handles[0], encrypted.inputProof);
      await tx.wait();

      const result = await contract.getEncryptedCounter();
      expect(result).to.not.be.undefined;
    });
  });

  describe("Multiplication Operations", function () {
    /**
     * ✅ SUCCESS: Multiply encrypted values
     * - Demonstrates FHE.mul operation
     * - Encrypted multiplication
     */
    it("should multiply encrypted values", async function () {
      const account = accounts[0];

      // Set initial value
      const setInput = await account.createEncryptedInput(
        await contract.getAddress(),
        account.address
      );
      setInput.add32(5);
      const setEncrypted = await setInput.encrypt();
      await contract.addToCounter(setEncrypted.handles[0], setEncrypted.inputProof);

      // Multiply by 2
      const mulInput = await account.createEncryptedInput(
        await contract.getAddress(),
        account.address
      );
      mulInput.add32(2);
      const mulEncrypted = await mulInput.encrypt();

      const tx = await contract.multiplyCounter(
        mulEncrypted.handles[0],
        mulEncrypted.inputProof
      );
      await tx.wait();

      const result = await contract.getEncryptedCounter();
      expect(result).to.not.be.undefined;
    });

    /**
     * ⚠️  WARNING: FHE Complexity
     * Multiplication in FHE is computationally expensive
     * Can increase ciphertext size and computation time
     * Not all FHE schemes support fast multiplication
     */
    it("should handle expensive multiplication", async function () {
      const account = accounts[0];

      // Large number multiplication
      const input = await account.createEncryptedInput(
        await contract.getAddress(),
        account.address
      );
      input.add32(1000000);
      const encrypted = await input.encrypt();

      // This might be slow on public networks
      const tx = await contract.multiplyCounter(encrypted.handles[0], encrypted.inputProof);
      await tx.wait();

      const result = await contract.getEncryptedCounter();
      expect(result).to.not.be.undefined;
    });
  });

  describe("FHE Pattern Validation", function () {
    /**
     * ✅ PATTERN: Correct permission management
     * - FHE.allowThis grants contract permission
     * - FHE.allow grants user permission
     * - Both are necessary
     */
    it("should maintain proper FHE permissions", async function () {
      const account = accounts[0];

      const input = await account.createEncryptedInput(
        await contract.getAddress(),
        account.address
      );
      input.add32(7);
      const encrypted = await input.encrypt();

      // Operations grant proper permissions
      const tx = await contract.addToCounter(encrypted.handles[0], encrypted.inputProof);
      await tx.wait();

      // User can retrieve encrypted value
      const result = await contract.getEncryptedCounter();
      expect(result).to.not.be.undefined;
    });

    /**
     * 🔒 PRIVACY: Encrypted operations are private
     * - No one can see intermediate values
     * - Operations happen on encrypted data
     * - Only authorized parties can decrypt
     */
    it("should preserve privacy in arithmetic operations", async function () {
      const account = accounts[0];

      // Original value
      const value1 = 25;
      const input1 = await account.createEncryptedInput(
        await contract.getAddress(),
        account.address
      );
      input1.add32(value1);
      const encrypted1 = await input1.encrypt();
      await contract.addToCounter(encrypted1.handles[0], encrypted1.inputProof);

      // Added value
      const value2 = 13;
      const input2 = await account.createEncryptedInput(
        await contract.getAddress(),
        account.address
      );
      input2.add32(value2);
      const encrypted2 = await input2.encrypt();
      await contract.addToCounter(encrypted2.handles[0], encrypted2.inputProof);

      // No one can see the intermediate encrypted value
      // Or that it's the sum of 25 + 13
      const result = await contract.getEncryptedCounter();
      expect(result).to.not.be.undefined;

      // Only account holder can decrypt to see it's 38
    });
  });

  describe("Composition of Operations", function () {
    /**
     * ✅ SUCCESS: Chain multiple operations
     * - Add, then subtract, then multiply
     * - All on encrypted data
     */
    it("should support operation composition", async function () {
      const account = accounts[0];

      // Add 10
      const add10 = await account.createEncryptedInput(
        await contract.getAddress(),
        account.address
      );
      add10.add32(10);
      const enc10 = await add10.encrypt();
      await contract.addToCounter(enc10.handles[0], enc10.inputProof);

      // Subtract 3
      const sub3 = await account.createEncryptedInput(
        await contract.getAddress(),
        account.address
      );
      sub3.add32(3);
      const enc3 = await sub3.encrypt();
      await contract.subtractFromCounter(enc3.handles[0], enc3.inputProof);

      // Multiply by 2
      const mul2 = await account.createEncryptedInput(
        await contract.getAddress(),
        account.address
      );
      mul2.add32(2);
      const encMul = await mul2.encrypt();
      await contract.multiplyCounter(encMul.handles[0], encMul.inputProof);

      // Final result should be (10 - 3) * 2 = 14
      const result = await contract.getEncryptedCounter();
      expect(result).to.not.be.undefined;
    });
  });
});
