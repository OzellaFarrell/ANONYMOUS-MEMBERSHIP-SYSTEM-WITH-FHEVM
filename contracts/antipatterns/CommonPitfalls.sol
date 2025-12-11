// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title CommonPitfalls
/// @notice Demonstrates common FHE mistakes and correct solutions
/// @dev Educational contract showing what NOT to do
contract CommonPitfalls is ZamaEthereumConfig {
  /// @notice Encrypted value
  euint32 private encryptedValue;

  /// @notice PITFALL 1: Missing FHE.allowThis
  /// @dev ❌ THIS PATTERN IS WRONG
  /// If you only call FHE.allow but not FHE.allowThis,
  /// the contract won't be able to read the value
  /// @param externalValue Encrypted value
  /// @param inputProof Proof
  function pitfall_MissingAllowThis(externalEuint32 externalValue, bytes calldata inputProof)
    external
  {
    euint32 value = FHE.fromExternal(externalValue, inputProof);

    // ❌ WRONG: Only granting user permission
    // FHE.allow(value, msg.sender);
    // The contract (this) cannot decrypt without FHE.allowThis()

    // ✅ CORRECT: Grant both permissions
    FHE.allowThis(value);
    FHE.allow(value, msg.sender);

    encryptedValue = value;
  }

  /// @notice PITFALL 2: Trying to return encrypted values from view functions
  /// @dev ❌ PROBLEMATIC PATTERN
  /// This actually works in Solidity, but can cause issues:
  /// - View functions are called locally
  /// - Cannot perform decryption in view functions
  /// - Limits functionality
  function pitfall_ViewFunctionEncrypted() external view returns (euint32) {
    // ⚠️ CAUTION: Returning encrypted euint32 from view function
    // This compiles but limits usage patterns
    // Better to have non-view functions for encrypted operations
    return encryptedValue;
  }

  /// @notice PITFALL 3: Type mismatch in encrypted operations
  /// @dev ❌ WRONG TYPE MIXING
  /// Cannot directly add euint8 to euint32
  /// Must ensure consistent types
  function pitfall_TypeMismatch() external {
    // ❌ WRONG: Type mismatch would cause error
    // euint8 value8 = FHE.asEuint8(5);
    // euint32 value32 = FHE.asEuint32(10);
    // euint32 result = FHE.add(value8, value32); // Type error!

    // ✅ CORRECT: Convert to same type first
    // euint32 value8as32 = FHE.cast(value8, euint32);
    // euint32 result = FHE.add(value32, value8as32);
  }

  /// @notice PITFALL 4: Not validating encrypted input proof
  /// @dev This is automatically handled by FHE.fromExternal
  /// But good to understand the importance
  function pitfall_InputProofValidation(
    externalEuint32 externalValue,
    bytes calldata inputProof
  ) external {
    // ✅ CORRECT: FHE.fromExternal validates proof
    // The function automatically checks that:
    // 1. Input was encrypted for [this_contract, msg.sender]
    // 2. Proof correctly validates the encryption
    // 3. Value is correctly bound

    euint32 value = FHE.fromExternal(externalValue, inputProof);

    // ❌ WRONG: Don't trust external data without proof
    // This would allow anyone to submit arbitrary encrypted values
    // euint32 badValue = euint32.wrap(uint256(externalValue));

    FHE.allowThis(value);
    FHE.allow(value, msg.sender);

    encryptedValue = value;
  }

  /// @notice PITFALL 5: Exposing encrypted data in events
  /// @dev Events can leak information about encrypted values
  event ValueChanged(euint32 encryptedNewValue); // ❌ Questionable
  event ValueChangedSafe(address indexed user); // ✅ Better approach

  /// @notice PITFALL 6: Storing unencrypted sensitive data
  /// @dev ❌ ANTI-PATTERN
  mapping(address => uint32) private plaintextSecrets; // ❌ BAD!

  /// @dev ✅ CORRECT
  mapping(address => euint32) private encryptedSecrets; // ✅ GOOD!

  /// @notice PITFALL 7: Forgetting permission after modification
  /// @param newValue New encrypted value
  /// @param inputProof Proof
  function pitfall_PermissionsAfterModification(
    externalEuint32 newValue,
    bytes calldata inputProof
  ) external {
    euint32 value = FHE.fromExternal(newValue, inputProof);

    // Modify encrypted value
    euint32 modified = FHE.add(value, encryptedValue);

    // ❌ WRONG: Forgot to grant permissions!
    encryptedValue = modified;
    // FHE.allowThis(encryptedValue);
    // FHE.allow(encryptedValue, msg.sender);

    // ✅ CORRECT: Always grant permissions after modifications
    FHE.allowThis(encryptedValue);
    FHE.allow(encryptedValue, msg.sender);
  }

  /// @notice PITFALL 8: Assuming encrypted values are always safe
  /// @dev Even encrypted values need proper access control
  function pitfall_AccessControl(externalEuint32 secret, bytes calldata inputProof)
    external
  {
    // ✅ PATTERN: Add application-level access control
    // Even though value is encrypted, check business logic
    require(msg.sender != address(0), "CommonPitfalls: zero address");

    euint32 value = FHE.fromExternal(secret, inputProof);

    // ✅ CORRECT: Combine FHE encryption with access control
    if (msg.sender == tx.origin) {
      // Do something
    }

    FHE.allowThis(value);
    FHE.allow(value, msg.sender);
  }

  /// @notice Correct pattern summary
  /// @dev Shows the right way to handle encrypted values
  function correct_Pattern(externalEuint32 externalValue, bytes calldata inputProof)
    external
  {
    // ✅ STEP 1: Validate caller
    require(msg.sender != address(0), "CommonPitfalls: invalid caller");

    // ✅ STEP 2: Convert external encrypted value (validates proof)
    euint32 value = FHE.fromExternal(externalValue, inputProof);

    // ✅ STEP 3: Perform operations on encrypted data
    euint32 result = FHE.add(value, encryptedValue);

    // ✅ STEP 4: Store encrypted result
    encryptedValue = result;

    // ✅ STEP 5: Grant BOTH permissions
    FHE.allowThis(encryptedValue);
    FHE.allow(encryptedValue, msg.sender);

    // ✅ STEP 6: Emit safe event
    emit ValueChangedSafe(msg.sender);
  }

  /// @notice Get encrypted value (correct approach)
  /// @return Encrypted value for user decryption
  function getEncryptedValue() external view returns (euint32) {
    return encryptedValue;
  }
}
