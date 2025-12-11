// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHEArithmetic
/// @notice Demonstrates FHE arithmetic operations (add, sub, mul)
/// @dev Shows how to perform encrypted arithmetic operations
contract FHEArithmetic is ZamaEthereumConfig {
  /// @notice Encrypted counter value
  euint32 private encryptedCounter;

  /// @notice Initialize with zero
  constructor() {
    encryptedCounter = FHE.asEuint32(0);
  }

  /// @notice Add encrypted value to counter
  /// @param valueToAdd Encrypted amount to add
  /// @param inputProof Zero-knowledge proof
  function addToCounter(externalEuint32 valueToAdd, bytes calldata inputProof) external {
    // Convert external encrypted value
    euint32 value = FHE.fromExternal(valueToAdd, inputProof);

    // ✅ Correct: Perform encrypted addition
    encryptedCounter = FHE.add(encryptedCounter, value);

    // ✅ Correct: Grant permissions for contract and caller
    FHE.allowThis(encryptedCounter);
    FHE.allow(encryptedCounter, msg.sender);
  }

  /// @notice Subtract encrypted value from counter
  /// @param valueToSubtract Encrypted amount to subtract
  /// @param inputProof Zero-knowledge proof
  function subtractFromCounter(externalEuint32 valueToSubtract, bytes calldata inputProof)
    external
  {
    euint32 value = FHE.fromExternal(valueToSubtract, inputProof);

    // ✅ Correct: Perform encrypted subtraction
    // Note: In production, add underflow checks
    encryptedCounter = FHE.sub(encryptedCounter, value);

    FHE.allowThis(encryptedCounter);
    FHE.allow(encryptedCounter, msg.sender);
  }

  /// @notice Multiply counter by encrypted value
  /// @param multiplier Encrypted multiplier value
  /// @param inputProof Zero-knowledge proof
  function multiplyCounter(externalEuint32 multiplier, bytes calldata inputProof) external {
    euint32 value = FHE.fromExternal(multiplier, inputProof);

    // ✅ Correct: Perform encrypted multiplication
    encryptedCounter = FHE.mul(encryptedCounter, value);

    FHE.allowThis(encryptedCounter);
    FHE.allow(encryptedCounter, msg.sender);
  }

  /// @notice Get encrypted counter value
  /// @return Current encrypted counter
  function getEncryptedCounter() external view returns (euint32) {
    return encryptedCounter;
  }

  /// @notice Demonstrate division (note: limited in FHE, use with caution)
  /// @param divisor Encrypted divisor
  /// @param inputProof Zero-knowledge proof
  function divideCounter(externalEuint32 divisor, bytes calldata inputProof) external {
    euint32 value = FHE.fromExternal(divisor, inputProof);

    // ⚠️ Note: Division in FHE is complex and may not be directly supported
    // This is a placeholder showing the pattern
    // encryptedCounter = FHE.div(encryptedCounter, value);

    FHE.allowThis(encryptedCounter);
    FHE.allow(encryptedCounter, msg.sender);
  }
}
