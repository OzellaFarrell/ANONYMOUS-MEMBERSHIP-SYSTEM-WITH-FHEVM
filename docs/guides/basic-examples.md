# Basic Examples Guide

This guide covers the fundamental FHEVM examples and patterns you need to understand before building more complex contracts.

---

## Overview

The basic examples category includes:

1. **SimpleMembership** - Encrypted member registration
2. **FHEArithmetic** - Basic encrypted arithmetic (add, subtract)
3. **EqualityComparison** - Encrypted comparisons (equals, greater than, less than)
4. **EncryptSingleValue** - Encrypting and storing a single value
5. **MemberStatus** - Tracking member status privately

---

## Example 1: SimpleMembership

### What It Demonstrates

- Encrypting user data
- Storing encrypted values in contract state
- Managing permission access
- Tracking membership status

### Key Concepts

```solidity
// 1. Encrypted state variable
mapping(address => euint32) private memberStatus;

// 2. Accept encrypted input with proof
function registerMember(externalEuint32 status, bytes calldata proof) external {
  // 3. Verify and convert input
  euint32 value = FHE.fromExternal(status, proof);

  // 4. Store encrypted value
  memberStatus[msg.sender] = value;

  // 5. Grant permissions
  FHE.allowThis(value);
  FHE.allow(value, msg.sender);
}
```

### When to Use

- User registration with private status
- Privacy-preserving member tracking
- Confidential account creation

---

## Example 2: FHEArithmetic

### What It Demonstrates

- Addition on encrypted values
- Subtraction on encrypted values
- Preserving encryption throughout operations

### Key Concepts

```solidity
// Add encrypted values
euint32 sum = FHE.add(value1, value2);

// Subtract encrypted values
euint32 difference = FHE.sub(value1, value2);

// Result is still encrypted
FHE.allowThis(sum);
```

### When to Use

- Private balance calculations
- Confidential scorekeeping
- Hidden tallies/counts

---

## Example 3: EqualityComparison

### What It Demonstrates

- Comparing encrypted values
- Returning encrypted booleans
- User decryption of comparison results

### Key Concepts

```solidity
// Compare encrypted values
// Returns ebool (encrypted boolean)
ebool isEqual = FHE.eq(value1, value2);
ebool isGreater = FHE.gt(value1, value2);
ebool isLess = FHE.lt(value1, value2);

// Must grant permissions
FHE.allowThis(isEqual);
FHE.allow(isEqual, msg.sender);

// Return for user decryption
return isEqual;
```

### When to Use

- Verifying membership without revealing value
- Comparing encrypted scores
- Checking encrypted conditions
- Decision making on encrypted data

---

## Example 4: EncryptSingleValue

### What It Demonstrates

- Single encrypted value handling
- Input proof verification
- Permission management

### Key Concepts

```solidity
mapping(address => euint32) private secrets;

function storeSecret(externalEuint32 secret, bytes calldata proof) external {
  // Convert with proof verification
  euint32 value = FHE.fromExternal(secret, proof);

  // Store encrypted secret
  secrets[msg.sender] = value;

  // Grant permissions
  FHE.allowThis(value);
  FHE.allow(value, msg.sender);
}

function getSecret() external view returns (euint32) {
  return secrets[msg.sender];
}
```

### When to Use

- Private data storage
- User secrets
- Confidential information

---

## Example 5: MemberStatus

### What It Demonstrates

- Multi-level status tracking
- Encrypted state variables
- Status queries

### Key Concepts

```solidity
enum MemberStatus {
  INACTIVE,
  ACTIVE,
  PRIVILEGED,
  SUSPENDED
}

// Store status encrypted
mapping(address => euint32) private status;

function setStatus(externalEuint32 newStatus, bytes calldata proof) external {
  euint32 value = FHE.fromExternal(newStatus, proof);
  status[msg.sender] = value;
  FHE.allowThis(value);
  FHE.allow(value, msg.sender);
}
```

### When to Use

- Membership tiers
- User roles (private)
- Account states

---

## Learning Path

### Start Here

1. **SimpleMembership** - Understand basic storage and permissions
2. **EncryptSingleValue** - Learn encryption input handling
3. **FHEArithmetic** - Understand encrypted operations

### Then Learn

4. **EqualityComparison** - Compare encrypted values
5. **MemberStatus** - Multiple status levels

### After Basics

- Move to Access Control examples
- Explore Advanced patterns
- Study anti-patterns

---

## Key Takeaways

### Encryption Pattern

```solidity
// Standard flow for all examples:

// 1. Accept encrypted input with proof
function doSomething(externalEuint32 input, bytes calldata proof) external {
  // 2. Verify and convert
  euint32 value = FHE.fromExternal(input, proof);

  // 3. Store or use
  myValues[msg.sender] = value;

  // 4. Grant permissions
  FHE.allowThis(value);
  FHE.allow(value, msg.sender);
}
```

### Permission Pattern

```solidity
// Always required:
FHE.allowThis(value);        // Contract can use
FHE.allow(value, msg.sender); // User can decrypt
```

### Proof Pattern

```solidity
// Client-side:
const input = await fhevm.createEncryptedInput(contractAddr, signer.address);
input.add32(value);
const { handles, inputProof } = await input.encrypt();

// Contract-side:
euint32 encrypted = FHE.fromExternal(handles[0], inputProof);
```

---

## Common Mistakes to Avoid

❌ Forgetting FHE.allowThis()
❌ Comparing encrypted with plain values
❌ Using calldata for constructor bytes
❌ Missing input proofs
❌ Wrong signer for proof

---

## Testing Tips

```typescript
// Always test:
// 1. Successful operation
// 2. With different values
// 3. Permission verification
// 4. User decryption capability
// 5. Error cases
```

---

## Next Steps

After understanding basic examples:

1. **Review** Access Control examples
2. **Study** Encryption patterns
3. **Explore** Decryption patterns
4. **Build** Your own contract

---

**Last Updated**: December 2025
