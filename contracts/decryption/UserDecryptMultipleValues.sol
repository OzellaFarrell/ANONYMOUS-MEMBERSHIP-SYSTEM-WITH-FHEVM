// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, euint8, externalEuint32, externalEuint8 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title UserDecryptMultipleValues
/// @notice Demonstrates user-side decryption of multiple encrypted values
/// @dev Shows how to handle multiple encrypted fields that only user can decrypt
contract UserDecryptMultipleValues is ZamaEthereumConfig {
  /// @notice User profile with multiple encrypted fields
  struct UserProfile {
    euint32 encryptedBalance;
    euint8 encryptedTier;
    euint32 encryptedScore;
    bool initialized;
  }

  /// @notice User profiles mapping
  mapping(address => UserProfile) private profiles;

  /// @notice Track profile existence
  mapping(address => bool) private hasProfile;

  /// @notice Event when profile is created
  event ProfileCreated(address indexed user);

  /// @notice Event when profile is updated
  event ProfileUpdated(address indexed user);

  /// @notice Create user profile with multiple encrypted values
  /// @param balance Encrypted balance value
  /// @param tier Encrypted tier level
  /// @param score Encrypted score value
  /// @param balanceProof Proof for balance
  /// @param tierProof Proof for tier
  /// @param scoreProof Proof for score
  /// @dev ✅ KEY PATTERN: Multiple user-decryptable values
  ///      - Each value encrypted to [contract, user] pair
  ///      - Each needs separate FHE.allow permission
  ///      - Only user can decrypt all values together
  ///      - Useful for user profiles with multiple private fields
  function createProfile(
    externalEuint32 balance,
    externalEuint8 tier,
    externalEuint32 score,
    bytes calldata balanceProof,
    bytes calldata tierProof,
    bytes calldata scoreProof
  ) external {
    require(!hasProfile[msg.sender], "UserDecryptMultipleValues: profile exists");

    // Convert all external encrypted values
    euint32 encBalance = FHE.fromExternal(balance, balanceProof);
    euint8 encTier = FHE.fromExternal(tier, tierProof);
    euint32 encScore = FHE.fromExternal(score, scoreProof);

    // Store all encrypted values
    profiles[msg.sender] = UserProfile({
      encryptedBalance: encBalance,
      encryptedTier: encTier,
      encryptedScore: encScore,
      initialized: true
    });
    hasProfile[msg.sender] = true;

    // ✅ CRITICAL: Grant permissions for EACH encrypted value
    FHE.allowThis(profiles[msg.sender].encryptedBalance);
    FHE.allow(profiles[msg.sender].encryptedBalance, msg.sender);

    FHE.allowThis(profiles[msg.sender].encryptedTier);
    FHE.allow(profiles[msg.sender].encryptedTier, msg.sender);

    FHE.allowThis(profiles[msg.sender].encryptedScore);
    FHE.allow(profiles[msg.sender].encryptedScore, msg.sender);

    emit ProfileCreated(msg.sender);
  }

  /// @notice Get encrypted balance for user decryption
  /// @return Encrypted balance value
  function getEncryptedBalance() external view returns (euint32) {
    require(hasProfile[msg.sender], "UserDecryptMultipleValues: no profile");
    return profiles[msg.sender].encryptedBalance;
  }

  /// @notice Get encrypted tier for user decryption
  /// @return Encrypted tier value
  function getEncryptedTier() external view returns (euint8) {
    require(hasProfile[msg.sender], "UserDecryptMultipleValues: no profile");
    return profiles[msg.sender].encryptedTier;
  }

  /// @notice Get encrypted score for user decryption
  /// @return Encrypted score value
  function getEncryptedScore() external view returns (euint32) {
    require(hasProfile[msg.sender], "UserDecryptMultipleValues: no profile");
    return profiles[msg.sender].encryptedScore;
  }

  /// @notice Update all encrypted profile values
  /// @param newBalance New encrypted balance
  /// @param newTier New encrypted tier
  /// @param newScore New encrypted score
  /// @param balanceProof Balance proof
  /// @param tierProof Tier proof
  /// @param scoreProof Score proof
  function updateProfile(
    externalEuint32 newBalance,
    externalEuint8 newTier,
    externalEuint32 newScore,
    bytes calldata balanceProof,
    bytes calldata tierProof,
    bytes calldata scoreProof
  ) external {
    require(hasProfile[msg.sender], "UserDecryptMultipleValues: no profile");

    // Convert new values
    euint32 encBalance = FHE.fromExternal(newBalance, balanceProof);
    euint8 encTier = FHE.fromExternal(newTier, tierProof);
    euint32 encScore = FHE.fromExternal(newScore, scoreProof);

    // Update all values
    profiles[msg.sender].encryptedBalance = encBalance;
    profiles[msg.sender].encryptedTier = encTier;
    profiles[msg.sender].encryptedScore = encScore;

    // Grant permissions for all updated values
    FHE.allowThis(profiles[msg.sender].encryptedBalance);
    FHE.allow(profiles[msg.sender].encryptedBalance, msg.sender);

    FHE.allowThis(profiles[msg.sender].encryptedTier);
    FHE.allow(profiles[msg.sender].encryptedTier, msg.sender);

    FHE.allowThis(profiles[msg.sender].encryptedScore);
    FHE.allow(profiles[msg.sender].encryptedScore, msg.sender);

    emit ProfileUpdated(msg.sender);
  }

  /// @notice Confirm multiple values were retrieved (after off-chain decryption)
  /// @param decryptedBalance Decrypted balance from relayer
  /// @param decryptedTier Decrypted tier from relayer
  /// @param decryptedScore Decrypted score from relayer
  /// @dev Pattern for verifying decryption and updating application state
  function confirmValuesRetrieved(uint32 decryptedBalance, uint8 decryptedTier, uint32 decryptedScore)
    external
  {
    require(hasProfile[msg.sender], "UserDecryptMultipleValues: no profile");

    // Verify decrypted values match expectations
    // In production, could store decrypted values off-chain
    // This just confirms retrieval

    emit ProfileUpdated(msg.sender);
  }

  /// @notice Check if user has profile
  /// @param user Address to check
  /// @return Boolean indicating if profile exists
  function userHasProfile(address user) external view returns (bool) {
    return hasProfile[user];
  }

  /// @notice Get profile initialization status
  /// @return Boolean indicating if profile is initialized
  function isProfileInitialized() external view returns (bool) {
    return profiles[msg.sender].initialized;
  }
}
