// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, euint8, externalEuint32, externalEuint8 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EncryptMultipleValues
/// @notice Demonstrates encrypting and storing multiple encrypted values
/// @dev Shows pattern for handling multiple encrypted inputs and types
contract EncryptMultipleValues is ZamaEthereumConfig {
  /// @notice User profile with multiple encrypted fields
  struct UserProfile {
    euint32 encryptedBalance;
    euint8 encryptedTier;
    euint32 encryptedScore;
    bool isInitialized;
  }

  /// @notice Profiles mapping
  mapping(address => UserProfile) private profiles;

  /// @notice Event when profile is created
  event ProfileCreated(address indexed user);

  /// @notice Create encrypted user profile with multiple values
  /// @param balance Encrypted balance value
  /// @param tier Encrypted tier level (1-3)
  /// @param score Encrypted score value
  /// @param balanceProof Proof for balance
  /// @param tierProof Proof for tier
  /// @param scoreProof Proof for score
  /// @dev ✅ CORRECT PATTERN for multiple values:
  ///      1. Convert each external value separately
  ///      2. Store all converted values
  ///      3. Grant permissions for EACH encrypted value
  function createProfile(
    externalEuint32 balance,
    externalEuint8 tier,
    externalEuint32 score,
    bytes calldata balanceProof,
    bytes calldata tierProof,
    bytes calldata scoreProof
  ) external {
    require(!profiles[msg.sender].isInitialized, "EncryptMultipleValues: profile exists");

    // ✅ Step 1: Convert each external encrypted value
    euint32 encBalance = FHE.fromExternal(balance, balanceProof);
    euint8 encTier = FHE.fromExternal(tier, tierProof);
    euint32 encScore = FHE.fromExternal(score, scoreProof);

    // ✅ Step 2: Store all encrypted values in profile
    profiles[msg.sender] = UserProfile({
      encryptedBalance: encBalance,
      encryptedTier: encTier,
      encryptedScore: encScore,
      isInitialized: true
    });

    // ✅ Step 3: Grant permissions for EACH encrypted value
    // Balance permissions
    FHE.allowThis(profiles[msg.sender].encryptedBalance);
    FHE.allow(profiles[msg.sender].encryptedBalance, msg.sender);

    // Tier permissions
    FHE.allowThis(profiles[msg.sender].encryptedTier);
    FHE.allow(profiles[msg.sender].encryptedTier, msg.sender);

    // Score permissions
    FHE.allowThis(profiles[msg.sender].encryptedScore);
    FHE.allow(profiles[msg.sender].encryptedScore, msg.sender);

    emit ProfileCreated(msg.sender);
  }

  /// @notice Get encrypted balance
  /// @return Encrypted balance
  function getBalance() external view returns (euint32) {
    require(profiles[msg.sender].isInitialized, "EncryptMultipleValues: no profile");
    return profiles[msg.sender].encryptedBalance;
  }

  /// @notice Get encrypted tier
  /// @return Encrypted tier level
  function getTier() external view returns (euint8) {
    require(profiles[msg.sender].isInitialized, "EncryptMultipleValues: no profile");
    return profiles[msg.sender].encryptedTier;
  }

  /// @notice Get encrypted score
  /// @return Encrypted score
  function getScore() external view returns (euint32) {
    require(profiles[msg.sender].isInitialized, "EncryptMultipleValues: no profile");
    return profiles[msg.sender].encryptedScore;
  }

  /// @notice Update multiple encrypted values at once
  /// @param newBalance New encrypted balance
  /// @param newTier New encrypted tier
  /// @param newScore New encrypted score
  /// @param balanceProof Proof for balance
  /// @param tierProof Proof for tier
  /// @param scoreProof Proof for score
  function updateProfile(
    externalEuint32 newBalance,
    externalEuint8 newTier,
    externalEuint32 newScore,
    bytes calldata balanceProof,
    bytes calldata tierProof,
    bytes calldata scoreProof
  ) external {
    require(profiles[msg.sender].isInitialized, "EncryptMultipleValues: no profile");

    // Convert all new encrypted values
    euint32 encBalance = FHE.fromExternal(newBalance, balanceProof);
    euint8 encTier = FHE.fromExternal(newTier, tierProof);
    euint32 encScore = FHE.fromExternal(newScore, scoreProof);

    // Update all values
    profiles[msg.sender].encryptedBalance = encBalance;
    profiles[msg.sender].encryptedTier = encTier;
    profiles[msg.sender].encryptedScore = encScore;

    // Grant permissions for each updated value
    FHE.allowThis(profiles[msg.sender].encryptedBalance);
    FHE.allow(profiles[msg.sender].encryptedBalance, msg.sender);

    FHE.allowThis(profiles[msg.sender].encryptedTier);
    FHE.allow(profiles[msg.sender].encryptedTier, msg.sender);

    FHE.allowThis(profiles[msg.sender].encryptedScore);
    FHE.allow(profiles[msg.sender].encryptedScore, msg.sender);

    emit ProfileCreated(msg.sender);
  }

  /// @notice Check if user has profile
  /// @param user Address to check
  /// @return Boolean indicating if profile exists
  function hasProfile(address user) external view returns (bool) {
    return profiles[user].isInitialized;
  }
}
