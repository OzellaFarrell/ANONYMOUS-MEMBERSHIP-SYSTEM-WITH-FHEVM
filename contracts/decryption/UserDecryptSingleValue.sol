// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title UserDecryptSingleValue
/// @notice Demonstrates user-side decryption of a single encrypted value
/// @dev Shows how to handle values that only the user can decrypt
contract UserDecryptSingleValue is ZamaEthereumConfig {
  /// @notice Encrypted secret value
  mapping(address => euint32) private userSecrets;

  /// @notice Track stored secrets
  mapping(address => bool) private hasSecret;

  /// @notice Event when secret is stored
  event SecretStored(address indexed user);

  /// @notice Event when secret is retrieved (off-chain decryption)
  event SecretRetrieved(address indexed user);

  /// @notice Store an encrypted secret that only user can decrypt
  /// @param encryptedSecret User's encrypted secret
  /// @param inputProof Zero-knowledge proof
  /// @dev ✅ KEY PATTERN: User-decryptable secrets
  ///      - Encrypted to [contract, user] pair
  ///      - User has FHE.allow permission
  ///      - Only user can decrypt via relayer
  function storeUserSecret(externalEuint32 encryptedSecret, bytes calldata inputProof)
    external
  {
    require(!hasSecret[msg.sender], "UserDecryptSingleValue: secret exists");

    // Convert external encrypted value
    euint32 secret = FHE.fromExternal(encryptedSecret, inputProof);

    // Store encrypted secret
    userSecrets[msg.sender] = secret;
    hasSecret[msg.sender] = true;

    // Grant permissions
    FHE.allowThis(userSecrets[msg.sender]);
    FHE.allow(userSecrets[msg.sender], msg.sender);

    emit SecretStored(msg.sender);
  }

  /// @notice Get encrypted secret (for relayer decryption)
  /// @return Encrypted secret value
  /// @dev User calls this to get the encrypted handle
  ///      Then passes it to relayer for decryption
  ///      Only user can decrypt because of FHE permissions
  function getEncryptedSecret() external view returns (euint32) {
    require(hasSecret[msg.sender], "UserDecryptSingleValue: no secret");
    return userSecrets[msg.sender];
  }

  /// @notice Demonstrate value was retrieved (called after off-chain decryption)
  /// @param decryptedValue The decrypted value from relayer
  /// @dev In real system:
  ///      1. User calls getEncryptedSecret()
  ///      2. User sends handle to relayer
  ///      3. Relayer decrypts (needs FHE.allow permission)
  ///      4. User receives plain value off-chain
  function confirmSecretRetrieved(uint32 decryptedValue) external {
    require(hasSecret[msg.sender], "UserDecryptSingleValue: no secret");

    // In production, could verify decrypted value matches
    // For now, just confirm retrieval
    emit SecretRetrieved(msg.sender);
  }

  /// @notice Update encrypted secret
  /// @param newSecret New encrypted secret
  /// @param inputProof Zero-knowledge proof
  function updateSecret(externalEuint32 newSecret, bytes calldata inputProof) external {
    require(hasSecret[msg.sender], "UserDecryptSingleValue: no secret");

    euint32 secret = FHE.fromExternal(newSecret, inputProof);
    userSecrets[msg.sender] = secret;

    // Grant permissions for new value
    FHE.allowThis(userSecrets[msg.sender]);
    FHE.allow(userSecrets[msg.sender], msg.sender);

    emit SecretStored(msg.sender);
  }

  /// @notice Clear secret
  function clearSecret() external {
    require(hasSecret[msg.sender], "UserDecryptSingleValue: no secret");
    hasSecret[msg.sender] = false;
    // Set to zero value since encrypted types cannot be deleted
    userSecrets[msg.sender] = FHE.asEuint32(0);
  }
}
