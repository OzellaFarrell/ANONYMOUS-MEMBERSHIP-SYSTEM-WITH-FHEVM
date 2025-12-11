// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EncryptSingleValue
/// @notice Demonstrates encrypting and storing a single encrypted value
/// @dev Shows the correct pattern for handling encrypted inputs
contract EncryptSingleValue is ZamaEthereumConfig {
  /// @notice Encrypted secret value
  mapping(address => euint32) private secrets;

  /// @notice Track which addresses have secrets set
  mapping(address => bool) private hasSecret;

  /// @notice Event when secret is stored
  event SecretStored(address indexed owner);

  /// @notice Store a single encrypted secret value
  /// @param encryptedSecret Externally encrypted secret
  /// @param inputProof Zero-knowledge proof of correct encryption
  /// @dev ✅ CORRECT PATTERN:
  ///      1. Receive externalEuint32 with proof
  ///      2. Convert using FHE.fromExternal
  ///      3. Validate proof binding
  ///      4. Store encrypted value
  ///      5. Grant FHE permissions
  function storeSecret(externalEuint32 encryptedSecret, bytes calldata inputProof) external {
    // ✅ Step 1: Verify caller hasn't already stored a secret
    require(!hasSecret[msg.sender], "EncryptSingleValue: secret already stored");

    // ✅ Step 2: Convert external encrypted value to internal
    // This validates the zero-knowledge proof automatically
    euint32 secret = FHE.fromExternal(encryptedSecret, inputProof);

    // ✅ Step 3: Store the encrypted value
    // The value is encrypted to [this_contract, msg.sender] pair
    secrets[msg.sender] = secret;
    hasSecret[msg.sender] = true;

    // ✅ Step 4: Grant FHE permissions (CRITICAL!)
    // Contract needs permission to read encrypted value
    FHE.allowThis(secrets[msg.sender]);

    // Caller needs permission to decrypt their own value
    FHE.allow(secrets[msg.sender], msg.sender);

    emit SecretStored(msg.sender);
  }

  /// @notice Retrieve your encrypted secret
  /// @return Your encrypted secret value
  function getSecret() external view returns (euint32) {
    require(hasSecret[msg.sender], "EncryptSingleValue: no secret stored");
    return secrets[msg.sender];
  }

  /// @notice Update your encrypted secret
  /// @param newSecret New encrypted secret value
  /// @param inputProof Zero-knowledge proof
  function updateSecret(externalEuint32 newSecret, bytes calldata inputProof) external {
    require(hasSecret[msg.sender], "EncryptSingleValue: no secret stored");

    // Convert and store new encrypted value
    euint32 secret = FHE.fromExternal(newSecret, inputProof);
    secrets[msg.sender] = secret;

    // Grant permissions again for new value
    FHE.allowThis(secrets[msg.sender]);
    FHE.allow(secrets[msg.sender], msg.sender);

    emit SecretStored(msg.sender);
  }

  /// @notice Check if address has stored a secret
  /// @param user Address to check
  /// @return Boolean indicating if user has secret
  function userHasSecret(address user) external view returns (bool) {
    return hasSecret[user];
  }
}
