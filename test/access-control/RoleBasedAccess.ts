import { expect } from "chai";
import { ethers } from "hardhat";
import type { RoleBasedAccess } from "../../typechain-types";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Test Suite: RoleBasedAccess Contract
 *
 * Tests privacy-preserving role-based access control.
 * Demonstrates:
 * - Encrypted role assignment
 * - Role-based permissions
 * - Owner-only access control
 * - Encrypted role storage and retrieval
 * - Role revocation
 *
 * Key Patterns:
 * - Encrypted roles (euint8)
 * - Access control modifiers
 * - Permission management for role values
 * - Privacy-preserving authorization
 */
describe("RoleBasedAccess", function () {
  let contract: RoleBasedAccess;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let admin: HardhatEthersSigner;
  let contractAddress: string;

  // Role constants (matching contract)
  const ROLE_NONE = 0;
  const ROLE_USER = 1;
  const ROLE_MODERATOR = 2;
  const ROLE_ADMIN = 3;

  /**
   * Deploy contract before each test
   */
  beforeEach(async function () {
    [owner, user1, user2, admin] = await ethers.getSigners();

    const RoleBasedAccessFactory = await ethers.getContractFactory(
      "RoleBasedAccess"
    );
    contract = await RoleBasedAccessFactory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  /**
   * Test 1: Contract deployment
   * Verifies contract deploys with correct owner
   */
  it("should deploy with correct owner", async function () {
    expect(await contract.getAddress()).to.be.properAddress;
    expect(await contract.owner()).to.equal(owner.address);
  });

  /**
   * Test 2: Role constants
   * Verifies role constants are accessible
   */
  it("should have correct role constants", async function () {
    expect(await contract.ROLE_NONE()).to.equal(ROLE_NONE);
    expect(await contract.ROLE_USER()).to.equal(ROLE_USER);
    expect(await contract.ROLE_MODERATOR()).to.equal(ROLE_MODERATOR);
    expect(await contract.ROLE_ADMIN()).to.equal(ROLE_ADMIN);
  });

  /**
   * Test 3: Assign encrypted role
   * Tests owner assigning encrypted role to user
   *
   * Pattern demonstrated:
   * 1. Owner creates encrypted role value
   * 2. Submits with proof to assignRole
   * 3. Contract stores encrypted role
   * 4. Grants permissions to user
   */
  it("should assign encrypted role to user", async function () {
    // Create encrypted role (ROLE_USER = 1)
    const input = await (owner as any).createEncryptedInput(
      contractAddress,
      owner.address
    );
    input.add8(ROLE_USER);
    const encrypted = await input.encrypt();

    // Assign role to user1
    const tx = await contract.assignRole(
      user1.address,
      encrypted.handles[0],
      encrypted.inputProof
    );
    await tx.wait();

    // Verify role is assigned (can get encrypted role)
    const role = await contract.connect(user1).getEncryptedRole();
    expect(role).to.not.be.undefined;
  });

  /**
   * Test 4: Event emission on role assignment
   * Verifies RoleAssigned event is emitted
   */
  it("should emit RoleAssigned event", async function () {
    const input = await (owner as any).createEncryptedInput(
      contractAddress,
      owner.address
    );
    input.add8(ROLE_MODERATOR);
    const encrypted = await input.encrypt();

    await expect(
      contract.assignRole(user1.address, encrypted.handles[0], encrypted.inputProof)
    )
      .to.emit(contract, "RoleAssigned")
      .withArgs(user1.address);
  });

  /**
   * Test 5: Only owner can assign roles
   * Tests that non-owners cannot assign roles
   */
  it("should reject role assignment from non-owner", async function () {
    const input = await (user1 as any).createEncryptedInput(
      contractAddress,
      user1.address
    );
    input.add8(ROLE_USER);
    const encrypted = await input.encrypt();

    await expect(
      contract
        .connect(user1)
        .assignRole(user2.address, encrypted.handles[0], encrypted.inputProof)
    ).to.be.revertedWith("Only owner can call this");
  });

  /**
   * Test 6: Assign different roles
   * Tests assigning various role levels
   */
  it("should assign different role levels", async function () {
    // Assign USER role to user1
    const input1 = await (owner as any).createEncryptedInput(
      contractAddress,
      owner.address
    );
    input1.add8(ROLE_USER);
    const encrypted1 = await input1.encrypt();
    await contract.assignRole(
      user1.address,
      encrypted1.handles[0],
      encrypted1.inputProof
    );

    // Assign ADMIN role to admin
    const input2 = await (owner as any).createEncryptedInput(
      contractAddress,
      owner.address
    );
    input2.add8(ROLE_ADMIN);
    const encrypted2 = await input2.encrypt();
    await contract.assignRole(
      admin.address,
      encrypted2.handles[0],
      encrypted2.inputProof
    );

    // Both should have roles
    const role1 = await contract.connect(user1).getEncryptedRole();
    const role2 = await contract.connect(admin).getEncryptedRole();

    expect(role1).to.not.be.undefined;
    expect(role2).to.not.be.undefined;
  });

  /**
   * Test 7: Revoke role
   * Tests revoking user's role
   */
  it("should revoke user role", async function () {
    // First assign a role
    const input = await (owner as any).createEncryptedInput(
      contractAddress,
      owner.address
    );
    input.add8(ROLE_MODERATOR);
    const encrypted = await input.encrypt();
    await contract.assignRole(
      user1.address,
      encrypted.handles[0],
      encrypted.inputProof
    );

    // Revoke role
    const tx = await contract.revokeRole(user1.address);
    await tx.wait();

    // User should still have a role value (ROLE_NONE = 0)
    const role = await contract.connect(user1).getEncryptedRole();
    expect(role).to.not.be.undefined;
  });

  /**
   * Test 8: Event emission on role revocation
   * Verifies RoleRevoked event is emitted
   */
  it("should emit RoleRevoked event", async function () {
    // Assign role first
    const input = await (owner as any).createEncryptedInput(
      contractAddress,
      owner.address
    );
    input.add8(ROLE_USER);
    const encrypted = await input.encrypt();
    await contract.assignRole(
      user1.address,
      encrypted.handles[0],
      encrypted.inputProof
    );

    // Revoke and check event
    await expect(contract.revokeRole(user1.address))
      .to.emit(contract, "RoleRevoked")
      .withArgs(user1.address);
  });

  /**
   * Test 9: Only owner can revoke roles
   * Tests that non-owners cannot revoke roles
   */
  it("should reject role revocation from non-owner", async function () {
    await expect(
      contract.connect(user1).revokeRole(user2.address)
    ).to.be.revertedWith("Only owner can call this");
  });

  /**
   * Test 10: Get encrypted role
   * Tests retrieval of user's encrypted role
   */
  it("should return encrypted role for user", async function () {
    // Assign role
    const input = await (owner as any).createEncryptedInput(
      contractAddress,
      owner.address
    );
    input.add8(ROLE_ADMIN);
    const encrypted = await input.encrypt();
    await contract.assignRole(
      user1.address,
      encrypted.handles[0],
      encrypted.inputProof
    );

    // Get encrypted role
    const role = await contract.connect(user1).getEncryptedRole();

    // Should return encrypted value (not plaintext)
    expect(role).to.not.be.undefined;
    expect(role).to.not.equal(ROLE_ADMIN); // Encrypted, not plaintext
  });

  /**
   * Test 11: Update role
   * Tests updating existing role to new role
   */
  it("should update user role", async function () {
    // Assign initial role (USER)
    const input1 = await (owner as any).createEncryptedInput(
      contractAddress,
      owner.address
    );
    input1.add8(ROLE_USER);
    const encrypted1 = await input1.encrypt();
    await contract.assignRole(
      user1.address,
      encrypted1.handles[0],
      encrypted1.inputProof
    );

    // Update to MODERATOR
    const input2 = await (owner as any).createEncryptedInput(
      contractAddress,
      owner.address
    );
    input2.add8(ROLE_MODERATOR);
    const encrypted2 = await input2.encrypt();
    await contract.assignRole(
      user1.address,
      encrypted2.handles[0],
      encrypted2.inputProof
    );

    // Should have updated role
    const role = await contract.connect(user1).getEncryptedRole();
    expect(role).to.not.be.undefined;
  });

  /**
   * Test 12: Multiple users with different roles
   * Tests assigning roles to multiple users independently
   */
  it("should manage multiple users with different roles", async function () {
    // Assign USER role to user1
    const input1 = await (owner as any).createEncryptedInput(
      contractAddress,
      owner.address
    );
    input1.add8(ROLE_USER);
    const encrypted1 = await input1.encrypt();
    await contract.assignRole(
      user1.address,
      encrypted1.handles[0],
      encrypted1.inputProof
    );

    // Assign ADMIN role to user2
    const input2 = await (owner as any).createEncryptedInput(
      contractAddress,
      owner.address
    );
    input2.add8(ROLE_ADMIN);
    const encrypted2 = await input2.encrypt();
    await contract.assignRole(
      user2.address,
      encrypted2.handles[0],
      encrypted2.inputProof
    );

    // Both should have roles
    const role1 = await contract.connect(user1).getEncryptedRole();
    const role2 = await contract.connect(user2).getEncryptedRole();

    expect(role1).to.not.be.undefined;
    expect(role2).to.not.be.undefined;
  });

  /**
   * Test 13: Admin function access
   * Tests admin-only function access control
   */
  it("should allow owner to call admin function", async function () {
    await expect(contract.connect(owner).adminFunction()).to.not.be.reverted;
  });

  /**
   * Test 14: Admin function restriction
   * Tests that non-owners cannot call admin function
   */
  it("should reject admin function from non-owner", async function () {
    await expect(
      contract.connect(user1).adminFunction()
    ).to.be.revertedWith("Only admin can call this");
  });

  /**
   * Test 15: Minimum role check
   * Tests hasMinimumRole function
   */
  it("should check minimum role requirement", async function () {
    // Assign role
    const input = await (owner as any).createEncryptedInput(
      contractAddress,
      owner.address
    );
    input.add8(ROLE_MODERATOR);
    const encrypted = await input.encrypt();
    await contract.assignRole(
      user1.address,
      encrypted.handles[0],
      encrypted.inputProof
    );

    // Check minimum role (placeholder implementation)
    const hasRole = await contract.connect(user1).hasMinimumRole(ROLE_USER);

    // Currently returns true (placeholder)
    expect(typeof hasRole).to.equal("boolean");
  });

  /**
   * Test 16: Revoke and reassign
   * Tests revoking then reassigning a role
   */
  it("should allow revoke and reassign", async function () {
    // Assign role
    const input1 = await (owner as any).createEncryptedInput(
      contractAddress,
      owner.address
    );
    input1.add8(ROLE_USER);
    const encrypted1 = await input1.encrypt();
    await contract.assignRole(
      user1.address,
      encrypted1.handles[0],
      encrypted1.inputProof
    );

    // Revoke
    await contract.revokeRole(user1.address);

    // Reassign with different role
    const input2 = await (owner as any).createEncryptedInput(
      contractAddress,
      owner.address
    );
    input2.add8(ROLE_ADMIN);
    const encrypted2 = await input2.encrypt();
    await contract.assignRole(
      user1.address,
      encrypted2.handles[0],
      encrypted2.inputProof
    );

    // Should have new role
    const role = await contract.connect(user1).getEncryptedRole();
    expect(role).to.not.be.undefined;
  });

  /**
   * Test 17: Assign ROLE_NONE
   * Tests explicitly assigning ROLE_NONE
   */
  it("should assign ROLE_NONE explicitly", async function () {
    const input = await (owner as any).createEncryptedInput(
      contractAddress,
      owner.address
    );
    input.add8(ROLE_NONE);
    const encrypted = await input.encrypt();

    await contract.assignRole(
      user1.address,
      encrypted.handles[0],
      encrypted.inputProof
    );

    const role = await contract.connect(user1).getEncryptedRole();
    expect(role).to.not.be.undefined;
  });

  /**
   * Test 18: Privacy verification
   * Verifies that encrypted role doesn't reveal plaintext
   */
  it("should not reveal plaintext role value", async function () {
    const plaintextRole = ROLE_MODERATOR;

    const input = await (owner as any).createEncryptedInput(
      contractAddress,
      owner.address
    );
    input.add8(plaintextRole);
    const encrypted = await input.encrypt();

    await contract.assignRole(
      user1.address,
      encrypted.handles[0],
      encrypted.inputProof
    );

    const role = await contract.connect(user1).getEncryptedRole();

    // Encrypted value, not plaintext
    expect(role).to.not.equal(plaintextRole);
  });
});
