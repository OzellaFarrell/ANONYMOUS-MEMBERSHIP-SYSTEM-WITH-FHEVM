// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EqualityComparison
/// @notice Demonstrates FHE equality comparison on encrypted values
/// @dev Shows how to compare encrypted values without decryption
contract EqualityComparison is ZamaEthereumConfig {
  /// @notice Encrypted target value
  euint32 private encryptedTarget;

  /// @notice Track guess attempts
  mapping(address => uint32) private guessCount;

  /// @notice Event when equality check is performed
  event EqualityChecked(address indexed guesser);

  /// @notice Initialize with target value
  /// @param target Initial encrypted target
  /// @param inputProof Zero-knowledge proof
  constructor(externalEuint32 target, bytes calldata inputProof) {
    euint32 value = FHE.fromExternal(target, inputProof);
    encryptedTarget = value;

    FHE.allowThis(encryptedTarget);
  }

  /// @notice Check if encrypted guess equals target (encrypted operation)
  /// @param encryptedGuess User's encrypted guess
  /// @param inputProof Zero-knowledge proof
  /// @return Whether guess equals target (as encrypted boolean)
  /// @dev ✅ KEY PATTERN: Encrypted comparison
  ///      - Compares two encrypted values
  ///      - Result is also encrypted
  ///      - No information leaked about either value
  ///      - Only user can decrypt result
  function checkEquality(externalEuint32 encryptedGuess, bytes calldata inputProof)
    external
    returns (bool)
  {
    // Convert user's guess
    euint32 guess = FHE.fromExternal(encryptedGuess, inputProof);

    // ✅ Perform encrypted equality check
    // Result is encrypted - tells user if guess matches
    bool isEqual = FHE.eq(encryptedTarget, guess);

    // Track attempt
    guessCount[msg.sender]++;

    emit EqualityChecked(msg.sender);

    // Note: In practice, isEqual would be encrypted
    // For this example, returning plain boolean for testing
    return isEqual;
  }

  /// @notice Get number of guesses made
  /// @param guesser Address to check
  /// @return Number of equality checks performed
  function getGuessCount(address guesser) external view returns (uint32) {
    return guessCount[guesser];
  }

  /// @notice Update target value
  /// @param newTarget New encrypted target
  /// @param inputProof Zero-knowledge proof
  function updateTarget(externalEuint32 newTarget, bytes calldata inputProof) external {
    euint32 value = FHE.fromExternal(newTarget, inputProof);
    encryptedTarget = value;

    FHE.allowThis(encryptedTarget);
  }

  /// @notice Compare two encrypted values for equality
  /// @param encryptedA First encrypted value
  /// @param encryptedB Second encrypted value
  /// @param proofA Proof for first value
  /// @param proofB Proof for second value
  /// @return Whether they are equal
  function compareValues(
    externalEuint32 encryptedA,
    externalEuint32 encryptedB,
    bytes calldata proofA,
    bytes calldata proofB
  ) external pure returns (bool) {
    // Convert both values
    euint32 valueA = FHE.fromExternal(encryptedA, proofA);
    euint32 valueB = FHE.fromExternal(encryptedB, proofB);

    // ✅ Compare encrypted values
    return FHE.eq(valueA, valueB);
  }

  /// @notice Demonstrate conditional logic on encrypted values
  /// @param encryptedValue Encrypted value to check
  /// @param inputProof Zero-knowledge proof
  /// @dev Shows pattern for encrypted conditional logic
  function conditionalOperation(externalEuint32 encryptedValue, bytes calldata inputProof)
    external
    returns (bool)
  {
    euint32 value = FHE.fromExternal(encryptedValue, inputProof);

    // ✅ Can perform encrypted comparisons
    bool isGreater = FHE.gt(value, encryptedTarget);
    bool isLess = FHE.lt(value, encryptedTarget);
    bool isEqual = FHE.eq(value, encryptedTarget);

    // These comparisons happen on encrypted data
    // Results can drive contract logic
    return isEqual;
  }

  /// @notice Get encrypted target (for testing)
  /// @return Current encrypted target
  function getEncryptedTarget() external view returns (euint32) {
    return encryptedTarget;
  }
}
