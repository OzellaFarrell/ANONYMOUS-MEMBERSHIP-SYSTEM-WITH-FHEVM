# FHE Counter vs Simple Counter

This guide compares a traditional counter contract with an FHE (Fully Homomorphic Encryption) counter to demonstrate the privacy advantages of FHEVM.

## Overview

A counter is one of the simplest smart contract patterns. By comparing traditional and FHE implementations, we can clearly see how FHE provides privacy-preserving computation.

---

## Simple Counter (Traditional)

### Contract Code

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

/// @title A simple counter contract
contract SimpleCounter {
  uint32 private _count;

  /// @notice Returns the current count
  function getCount() external view returns (uint32) {
    return _count;
  }

  /// @notice Increments the counter by a specific value
  function increment(uint32 value) external {
    _count += value;
  }

  /// @notice Decrements the counter by a specific value
  function decrement(uint32 value) external {
    require(_count >= value, "Counter: cannot decrement below zero");
    _count -= value;
  }
}
```

### Characteristics

**✅ Simple & Straightforward**
- Easy to understand and implement
- Direct arithmetic operations
- Clear state visibility

**❌ No Privacy**
- Current count is publicly visible
- Anyone can see the exact value
- All increment/decrement operations are transparent
- Transaction history reveals all changes

**Use Cases**
- Public counters (page views, votes)
- Non-sensitive data tracking
- Transparent state management

---

## FHE Counter (Privacy-Preserving)

### Contract Code

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title A privacy-preserving FHE counter contract
contract FHECounter is ZamaEthereumConfig {
  euint32 private _count;

  /// @notice Initialize with encrypted zero
  constructor() {
    _count = FHE.asEuint32(0);
    FHE.allowThis(_count);
  }

  /// @notice Returns the encrypted count
  /// @dev Only those with proper permissions can decrypt
  function getCount() external view returns (euint32) {
    return _count;
  }

  /// @notice Increments the counter by an encrypted value
  /// @param encryptedValue Encrypted value to add
  /// @param inputProof Zero-knowledge proof
  function increment(externalEuint32 encryptedValue, bytes calldata inputProof)
    external
  {
    // Convert external encrypted input to internal representation
    euint32 value = FHE.fromExternal(encryptedValue, inputProof);

    // Perform encrypted addition
    _count = FHE.add(_count, value);

    // Grant permissions
    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);
  }

  /// @notice Decrements the counter by an encrypted value
  /// @param encryptedValue Encrypted value to subtract
  /// @param inputProof Zero-knowledge proof
  function decrement(externalEuint32 encryptedValue, bytes calldata inputProof)
    external
  {
    // Convert external encrypted input
    euint32 value = FHE.fromExternal(encryptedValue, inputProof);

    // Perform encrypted subtraction
    _count = FHE.sub(_count, value);

    // Grant permissions
    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);
  }
}
```

### Characteristics

**✅ Privacy-Preserving**
- Current count is encrypted and hidden
- Only authorized parties can decrypt
- Operations on encrypted data
- Input values remain confidential

**✅ Zero-Knowledge Proofs**
- Input proofs verify correctness without revealing values
- Prevents invalid encrypted inputs
- Ensures data integrity

**✅ Access Control**
- Granular permission management (FHE.allow)
- Contract permissions (FHE.allowThis)
- User-specific decryption rights

**⚠️ More Complex**
- Requires understanding of FHE concepts
- Input proof generation needed
- Cannot directly view state
- Requires relayer for decryption

**Use Cases**
- Private balances
- Confidential voting tallies
- Secret scoreboards
- Anonymous activity tracking

---

## Key Differences

| Aspect | Simple Counter | FHE Counter |
|--------|---------------|-------------|
| **State Type** | `uint32` | `euint32` (encrypted) |
| **Visibility** | Public | Encrypted |
| **Input Type** | Plain value | Encrypted with proof |
| **Operations** | `+`, `-` | `FHE.add()`, `FHE.sub()` |
| **Permissions** | None needed | FHE.allow required |
| **Gas Cost** | Low | Higher (encryption overhead) |
| **Privacy** | None | Complete |
| **Use in View** | ✅ Yes | ❌ Returns encrypted |
| **Decryption** | Not needed | Requires relayer |

---

## Code Comparison Side-by-Side

### State Declaration

```solidity
// Simple Counter
uint32 private _count;

// FHE Counter
euint32 private _count;  // Encrypted uint32
```

### Increment Operation

```solidity
// Simple Counter
function increment(uint32 value) external {
  _count += value;  // Direct addition
}

// FHE Counter
function increment(externalEuint32 encryptedValue, bytes calldata inputProof)
  external
{
  euint32 value = FHE.fromExternal(encryptedValue, inputProof);
  _count = FHE.add(_count, value);  // Encrypted addition
  FHE.allowThis(_count);
  FHE.allow(_count, msg.sender);
}
```

### Get Count

```solidity
// Simple Counter
function getCount() external view returns (uint32) {
  return _count;  // Returns plain value
}

// FHE Counter
function getCount() external view returns (euint32) {
  return _count;  // Returns encrypted value
}
```

---

## Privacy Analysis

### Simple Counter Privacy Issues

```solidity
// Anyone can read the count
uint32 count = counter.getCount();  // Reveals exact value

// All transactions are public
counter.increment(5);  // Everyone knows +5
counter.decrement(2);  // Everyone knows -2

// Final state is public
// History is public
// No privacy at all
```

### FHE Counter Privacy Features

```solidity
// Reading returns encrypted value
euint32 encryptedCount = counter.getCount();  // Cannot see value

// Inputs are encrypted
bytes memory proof = createProof(...);
counter.increment(encryptedValue, proof);  // Amount is hidden

// Only authorized users can decrypt
uint32 realValue = decryptWithRelayer(encryptedCount);  // Needs permission

// State is always encrypted
// History shows operations but not values
// Complete privacy
```

---

## When to Use Each

### Use Simple Counter When:
- ✅ Privacy is not required
- ✅ Transparency is desired
- ✅ Gas costs must be minimized
- ✅ Simplicity is paramount
- ✅ Public auditing is needed

### Use FHE Counter When:
- ✅ Privacy is critical
- ✅ Confidential state needed
- ✅ Authorized-only access required
- ✅ Competitive advantage from privacy
- ✅ Regulatory privacy requirements

---

## Testing Comparison

### Simple Counter Test

```typescript
it("should increment counter", async () => {
  await counter.increment(5);
  const count = await counter.getCount();
  expect(count).to.equal(5);  // Direct comparison
});
```

### FHE Counter Test

```typescript
it("should increment counter", async () => {
  // Create encrypted input
  const input = await fhevm.createEncryptedInput(contractAddress, signer.address);
  input.add32(5);
  const encryptedInput = await input.encrypt();

  // Increment with encrypted value
  await counter.increment(encryptedInput.handles[0], encryptedInput.inputProof);

  // Get encrypted result
  const encryptedCount = await counter.getCount();

  // Decrypt to verify
  const decryptedCount = await decryptEuint32(encryptedCount);
  expect(decryptedCount).to.equal(5);
});
```

---

## Migration Path

If you have a simple counter and want to make it private:

### Step 1: Change State Type
```solidity
// Before
uint32 private _count;

// After
euint32 private _count;
```

### Step 2: Update Constructor
```solidity
// Before
constructor() {
  _count = 0;
}

// After
constructor() {
  _count = FHE.asEuint32(0);
  FHE.allowThis(_count);
}
```

### Step 3: Update Functions
```solidity
// Before
function increment(uint32 value) external {
  _count += value;
}

// After
function increment(externalEuint32 encryptedValue, bytes calldata inputProof) external {
  euint32 value = FHE.fromExternal(encryptedValue, inputProof);
  _count = FHE.add(_count, value);
  FHE.allowThis(_count);
  FHE.allow(_count, msg.sender);
}
```

### Step 4: Update Return Types
```solidity
// Before
function getCount() external view returns (uint32) {
  return _count;
}

// After
function getCount() external view returns (euint32) {
  return _count;
}
```

---

## Best Practices

### For Simple Counter
1. Use appropriate integer size
2. Add overflow protection
3. Consider access control for write operations
4. Emit events for state changes

### For FHE Counter
1. Always validate input proofs
2. Grant both allowThis and allow permissions
3. Handle encrypted overflow carefully
4. Document decryption requirements
5. Test with encrypted values
6. Consider gas costs
7. Provide clear user documentation

---

## Conclusion

The FHE Counter provides complete privacy at the cost of complexity and gas usage. Choose based on your specific requirements:

- **Public counters** → Simple Counter
- **Private counters** → FHE Counter

Both patterns are valid; the choice depends on whether privacy is a requirement for your use case.

---

## Related Examples

- `contracts/basic/SimpleMembership.sol` - Simple encrypted membership
- `contracts/basic/FHEArithmetic.sol` - More FHE operations
- `contracts/encryption/EncryptSingleValue.sol` - Single value encryption patterns

---

**Last Updated**: December 2025
