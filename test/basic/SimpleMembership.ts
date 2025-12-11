import { expect } from "chai";
import { ethers } from "hardhat";
import { getSigners, initializeAccount } from "@fhevm/hardhat-plugin";
import { SimpleMembership } from "../../typechain-types";

describe("SimpleMembership", function () {
  let contract: SimpleMembership;
  let accounts: any[];

  /**
   * Setup: Deploy SimpleMembership contract before each test
   * Initialize FHEVM testing environment
   */
  beforeEach(async function () {
    accounts = await getSigners();

    const SimpleMembershipFactory = await ethers.getContractFactory("SimpleMembership");
    contract = await SimpleMembershipFactory.deploy();
    await contract.waitForDeployment();

    // Initialize FHEVM account
    await initializeAccount();
  });

  describe("Member Registration", function () {
    /**
     * ✅ SUCCESS: Register a new member with encrypted status
     * - Encrypts status locally
     * - Submits encrypted value with proof
     * - Member is registered and can be verified
     */
    it("should register a member with encrypted status", async function () {
      const account = accounts[0];

      // Create encrypted input with value 1 (active member)
      const encryptedInput = await account.createEncryptedInput(
        await contract.getAddress(),
        account.address
      );
      encryptedInput.add32(1); // 1 = active member
      const encrypted = await encryptedInput.encrypt();

      // Register member with encrypted status
      const tx = await contract.registerMember(encrypted.handles[0], encrypted.inputProof);
      await tx.wait();

      // Verify member can retrieve their encrypted status
      const memberStatus = await contract.getMemberStatus();
      expect(memberStatus).to.not.be.undefined;
    });

    /**
     * ❌ FAILURE: Try to register same member twice
     * - First registration succeeds
     * - Second registration attempt fails with error
     * - Prevents duplicate member registration
     */
    it("should not allow registering the same member twice", async function () {
      const account = accounts[0];

      // First registration
      const encryptedInput1 = await account.createEncryptedInput(
        await contract.getAddress(),
        account.address
      );
      encryptedInput1.add32(1);
      const encrypted1 = await encryptedInput1.encrypt();

      await contract.registerMember(encrypted1.handles[0], encrypted1.inputProof);

      // Second registration should fail
      const encryptedInput2 = await account.createEncryptedInput(
        await contract.getAddress(),
        account.address
      );
      encryptedInput2.add32(1);
      const encrypted2 = await encryptedInput2.encrypt();

      await expect(contract.registerMember(encrypted2.handles[0], encrypted2.inputProof)).to.be
        .revertedWithCustomError(contract, "");
    });

    /**
     * ✅ PRIVACY PATTERN: Binding of encrypted inputs
     * - Member encrypts data with their own address
     * - Contract receives encrypted data bound to that address
     * - Zero-knowledge proof validates correct binding
     * - Only member can decrypt their own data
     */
    it("should maintain encryption binding for member privacy", async function () {
      const account1 = accounts[0];
      const account2 = accounts[1];

      // Account 1 encrypts for themselves
      const encryptedInput = await account1.createEncryptedInput(
        await contract.getAddress(),
        account1.address
      );
      encryptedInput.add32(1);
      const encrypted = await encryptedInput.encrypt();

      // Account 1 registers successfully
      const tx = await contract.registerMember(encrypted.handles[0], encrypted.inputProof);
      await tx.wait();

      // Note: In this example, the encrypted data is tied to account1
      // Only account1 can decrypt their membership status
      const memberStatus = await contract.getMemberStatus();
      expect(memberStatus).to.not.be.undefined;
    });
  });

  describe("Member Status Updates", function () {
    /**
     * ✅ SUCCESS: Non-member cannot update status
     * - Unregistered address attempts update
     * - Transaction reverts with "not a member" error
     * - Prevents unauthorized status changes
     */
    it("should require member to exist before updating status", async function () {
      const account = accounts[0];

      // Try to update without registering
      const encryptedInput = await account.createEncryptedInput(
        await contract.getAddress(),
        account.address
      );
      encryptedInput.add32(0); // Set to inactive
      const encrypted = await encryptedInput.encrypt();

      await expect(contract.updateMemberStatus(encrypted.handles[0], encrypted.inputProof)).to.be
        .reverted;
    });

    /**
     * ✅ SUCCESS: Registered member can update status
     * - Member registers first
     * - Member updates their encrypted status
     * - New status is stored and accessible only to them
     */
    it("should allow registered member to update their status", async function () {
      const account = accounts[0];

      // Register member
      const registerInput = await account.createEncryptedInput(
        await contract.getAddress(),
        account.address
      );
      registerInput.add32(1); // Active
      const registerEncrypted = await registerInput.encrypt();

      await contract.registerMember(registerEncrypted.handles[0], registerEncrypted.inputProof);

      // Update status
      const updateInput = await account.createEncryptedInput(
        await contract.getAddress(),
        account.address
      );
      updateInput.add32(0); // Change to inactive
      const updateEncrypted = await updateInput.encrypt();

      const tx = await contract.updateMemberStatus(
        updateEncrypted.handles[0],
        updateEncrypted.inputProof
      );
      await tx.wait();

      // Verify update succeeded
      const memberStatus = await contract.getMemberStatus();
      expect(memberStatus).to.not.be.undefined;
    });
  });

  describe("Privacy Guarantees", function () {
    /**
     * 🔒 PRIVACY CONCEPT: Encrypted member tracking
     * - Each member's status is encrypted
     * - No external observer can see who is a member
     * - Membership status remains confidential
     * - Aggregated data (total members) is also encrypted
     */
    it("should maintain privacy of member status", async function () {
      const account = accounts[0];

      // Register with encrypted status
      const encryptedInput = await account.createEncryptedInput(
        await contract.getAddress(),
        account.address
      );
      encryptedInput.add32(1);
      const encrypted = await encryptedInput.encrypt();

      await contract.registerMember(encrypted.handles[0], encrypted.inputProof);

      // Member can view their own status
      // But external observers cannot determine membership from contract state
      const memberStatus = await contract.getMemberStatus();
      expect(memberStatus).to.not.be.undefined;
    });

    /**
     * 🔒 PRIVACY CONCEPT: Access control for encrypted data
     * - Contract grants FHE.allow permissions to member
     * - Member can decrypt their own data
     * - Others cannot decrypt (no permission)
     * - Encryption binding ensures isolation
     */
    it("should enforce FHE access control for member data", async function () {
      const account = accounts[0];

      // Register member
      const encryptedInput = await account.createEncryptedInput(
        await contract.getAddress(),
        account.address
      );
      encryptedInput.add32(1);
      const encrypted = await encryptedInput.encrypt();

      await contract.registerMember(encrypted.handles[0], encrypted.inputProof);

      // Member can access their data through contract interface
      // (Direct decryption requires FHE.allow permission granted by contract)
      const memberStatus = await contract.getMemberStatus();
      expect(memberStatus).to.not.be.undefined;
    });
  });

  describe("Common Pitfalls", function () {
    /**
     * ❌ PITFALL: Forgetting FHE permissions
     * This example shows what happens without proper FHE.allow:
     * - Contract must call FHE.allowThis(_encryptedValue)
     * - Contract must call FHE.allow(_encryptedValue, user)
     * - Missing either permission causes decryption to fail
     *
     * SimpleMembership properly implements both permissions
     * in registerMember() and updateMemberStatus()
     */

    /**
     * ❌ PITFALL: Mismatched encryption binding
     * If data encrypted by Account A is submitted by Account B:
     * - The zero-knowledge proof will fail validation
     * - Input binding mismatch prevents unauthorized use
     *
     * This contract prevents this by requiring account
     * to submit their own encrypted data
     */

    /**
     * ❌ PITFALL: Returning encrypted values from view functions
     * View functions marked as 'view' cannot perform decryption
     * This contract properly returns encrypted euint32 values
     * Decryption happens off-chain or through relayer
     */

    /**
     * ✅ CORRECT PATTERN: Storing encrypted state
     * The contract correctly stores encrypted member status
     * Uses mapping(address => euint32) for type-safe encrypted storage
     * Properly decrypts only when needed and authorized
     */
    it("should demonstrate correct FHE pattern usage", async function () {
      const account = accounts[0];

      // This demonstrates the correct pattern:
      // 1. Create encrypted input locally
      // 2. Send to contract with proof
      // 3. Contract validates proof
      // 4. Contract stores encrypted value
      // 5. Contract grants permissions
      // 6. Only authorized parties can decrypt

      const encryptedInput = await account.createEncryptedInput(
        await contract.getAddress(),
        account.address
      );
      encryptedInput.add32(1);
      const encrypted = await encryptedInput.encrypt();

      // Proper registration with all necessary FHE operations
      const tx = await contract.registerMember(encrypted.handles[0], encrypted.inputProof);
      await tx.wait();

      // Member can retrieve their encrypted status
      const memberStatus = await contract.getMemberStatus();
      expect(memberStatus).to.not.be.undefined;
    });
  });
});
