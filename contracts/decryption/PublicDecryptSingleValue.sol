// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title PublicDecryptSingleValue
/// @notice Demonstrates public decryption of encrypted values
/// @dev Shows how to decrypt values that anyone can read
contract PublicDecryptSingleValue is ZamaEthereumConfig {
  /// @notice Encrypted public value (anyone can decrypt)
  mapping(address => euint32) private publicValues;

  /// @notice Track public values
  mapping(address => bool) private hasValue;

  /// @notice Plain decrypted values stored on-chain
  mapping(address => uint32) private decryptedValues;

  /// @notice Event when value is stored
  event PublicValueStored(address indexed owner);

  /// @notice Event when value is decrypted
  event ValueDecrypted(address indexed owner, uint32 decryptedValue);

  /// @notice Store a value for public decryption
  /// @param encryptedValue Encrypted value
  /// @param inputProof Zero-knowledge proof
  /// @dev ✅ KEY PATTERN: Public-decryptable values
  ///      - Contract calls FHE.allowThis() - grants contract permission
  ///      - Anyone can decrypt through relayer (no FHE.allow for users)
  ///      - Decrypted value can be revealed on-chain
  function storePublicValue(externalEuint32 encryptedValue, bytes calldata inputProof)
    external
  {
    require(!hasValue[msg.sender], "PublicDecryptSingleValue: value exists");

    // Convert external encrypted value
    euint32 value = FHE.fromExternal(encryptedValue, inputProof);

    // Store encrypted value
    publicValues[msg.sender] = value;
    hasValue[msg.sender] = true;

    // Grant only contract permission (not individual users)
    // This makes it publicly decryptable
    FHE.allowThis(publicValues[msg.sender]);

    emit PublicValueStored(msg.sender);
  }

  /// @notice Get encrypted value handle (for public decryption)
  /// @return Encrypted value
  /// @dev Anyone can decrypt because contract has FHE.allowThis
  function getPublicValue() external view returns (euint32) {
    require(hasValue[msg.sender], "PublicDecryptSingleValue: no value");
    return publicValues[msg.sender];
  }

  /// @notice Submit decrypted value (from relayer)
  /// @param decryptedValue The decrypted value
  /// @dev ✅ PATTERN: Publishing decrypted results
  ///      1. Contract encrypts value with FHE.allowThis
  ///      2. Relayer decrypts (public permission)
  ///      3. Anyone submits decrypted value
  ///      4. Value stored on-chain for transparency
  function submitDecryptedValue(uint32 decryptedValue) external {
    require(hasValue[msg.sender], "PublicDecryptSingleValue: no value");

    // Store decrypted value on-chain
    decryptedValues[msg.sender] = decryptedValue;

    emit ValueDecrypted(msg.sender, decryptedValue);
  }

  /// @notice Get the decrypted value on-chain
  /// @param user Address to query
  /// @return Decrypted value (visible to all)
  function getDecryptedValue(address user) external view returns (uint32) {
    require(hasValue[user], "PublicDecryptSingleValue: no value");
    return decryptedValues[user];
  }

  /// @notice Compare two public values (encrypted)
  /// @param userA First user to compare
  /// @param userB Second user to compare
  /// @return Boolean indicating if values are equal
  function areValuesEqual(address userA, address userB) external view returns (bool) {
    require(hasValue[userA], "PublicDecryptSingleValue: userA has no value");
    require(hasValue[userB], "PublicDecryptSingleValue: userB has no value");

    // In production, would compare decrypted values
    return decryptedValues[userA] == decryptedValues[userB];
  }

  /// @notice Update public value
  /// @param newValue New encrypted value
  /// @param inputProof Zero-knowledge proof
  function updateValue(externalEuint32 newValue, bytes calldata inputProof) external {
    require(hasValue[msg.sender], "PublicDecryptSingleValue: no value");

    euint32 value = FHE.fromExternal(newValue, inputProof);
    publicValues[msg.sender] = value;

    // Grant permission for public decryption
    FHE.allowThis(publicValues[msg.sender]);

    emit PublicValueStored(msg.sender);
  }
}
