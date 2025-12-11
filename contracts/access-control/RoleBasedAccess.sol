// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint8, euint32, externalEuint8 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title RoleBasedAccess
/// @notice Privacy-preserving role-based access control
/// @dev Demonstrates encrypted role management using FHEVM
contract RoleBasedAccess is ZamaEthereumConfig {
  // Role definitions (encrypted)
  uint8 public constant ROLE_NONE = 0;
  uint8 public constant ROLE_USER = 1;
  uint8 public constant ROLE_MODERATOR = 2;
  uint8 public constant ROLE_ADMIN = 3;

  /// @notice Encrypted user roles
  mapping(address => euint8) private userRoles;

  /// @notice Owner address (for initial setup)
  address public owner;

  /// @notice Events
  event RoleAssigned(address indexed user);
  event RoleRevoked(address indexed user);

  /// @notice Initialize contract with owner
  constructor() {
    owner = msg.sender;
  }

  /// @notice Assign encrypted role to user
  /// @param user Address to assign role to
  /// @param encryptedRole Encrypted role value
  /// @param inputProof Zero-knowledge proof for encrypted input
  function assignRole(address user, externalEuint8 encryptedRole, bytes calldata inputProof)
    external
    onlyOwner
  {
    // Convert external encrypted value
    euint8 role = FHE.fromExternal(encryptedRole, inputProof);

    // Store encrypted role
    userRoles[user] = role;

    // Grant permissions
    FHE.allowThis(userRoles[user]);
    FHE.allow(userRoles[user], user);

    emit RoleAssigned(user);
  }

  /// @notice Revoke role from user (set to ROLE_NONE)
  /// @param user Address to revoke role from
  function revokeRole(address user) external onlyOwner {
    // Reset role to ROLE_NONE
    userRoles[user] = FHE.asEuint8(ROLE_NONE);

    FHE.allowThis(userRoles[user]);
    FHE.allow(userRoles[user], user);

    emit RoleRevoked(user);
  }

  /// @notice Get encrypted role of user
  /// @return Encrypted role value
  function getEncryptedRole() external view returns (euint8) {
    return userRoles[msg.sender];
  }

  /// @notice Check if caller has minimum required role (encrypted comparison)
  /// @param minRole Minimum required role level
  /// @return Boolean indicating if user meets requirement
  /// @dev Returns encrypted boolean - requires decryption
  function hasMinimumRole(uint8 minRole) external view returns (bool) {
    // This would require encrypted comparison in production
    // For now returns unencrypted for simplicity
    euint8 userRole = userRoles[msg.sender];
    // Note: In real implementation, this comparison should be encrypted
    return true; // Placeholder - requires FHE comparison
  }

  /// @notice Restricted function - only admins can call
  /// Demonstrates role-based access control pattern
  function adminFunction() external {
    require(msg.sender == owner, "Only admin can call this");
    // Admin-only logic here
  }

  /// @notice Modifier to check ownership
  modifier onlyOwner() {
    require(msg.sender == owner, "Only owner can call this");
    _;
  }
}
