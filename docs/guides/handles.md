# Understanding Handles in FHEVM

## Overview

A **handle** is a reference to an encrypted value stored in the FHEVM. Instead of storing the ciphertext directly, contracts work with handles that point to encrypted data in a secure enclave.

## What is a Handle?

### Definition

A handle is:
- A **unique identifier** for an encrypted value
- **Not the plaintext** - handle itself reveals nothing
- **Not the ciphertext** - ciphertext is stored securely
- A **reference** to encrypted data in the FHE execution context

### Visual Model

```
User's Device          FHEVM Contract          FHE Enclave
┌─────────────┐       ┌──────────────┐       ┌──────────┐
│ Plaintext:  │       │              │       │ Secure   │
│ value = 42  │  -->  │ Handle: 0x5a │  -->  │ Storage: │
│             │       │              │       │ 42 (enc) │
└─────────────┘       └──────────────┘       └──────────┘
```

## How Handles Work

### Creation

When you encrypt a value:

```typescript
const input = await account.createEncryptedInput(
  contractAddress,
  account.address
);
input.add32(42);  // Add plaintext value
const { handles, inputProof } = await input.encrypt();

// handles = [0x5a]  // Reference to encrypted 42
// The actual encrypted value is stored securely
```

### Storage

In the contract:

```solidity
euint32 private myValue;

function storeHandle(externalEuint32 handle, bytes calldata proof) external {
    // Convert external handle (from client) to internal
    euint32 value = FHE.fromExternal(handle, proof);

    // Now contract has internal handle
    myValue = value;
    // myValue internally refers to the encrypted data
}
```

### Operations

Handles can be used in operations:

```solidity
euint32 value1;  // Handle to encrypted value
euint32 value2;  // Handle to another encrypted value

// Operations work on handles (operating on encrypted data)
euint32 result = FHE.add(value1, value2);
// result is a new handle pointing to: encrypt(decrypt(value1) + decrypt(value2))
```

### Retrieval

To get encrypted data back out:

```solidity
function getEncryptedValue() external view returns (euint32) {
    // Return handle (reference to encrypted data)
    return myValue;
}
```

```typescript
// Client retrieves handle
const encryptedHandle = await contract.getEncryptedValue();

// Use relayer to decrypt
const decrypted = await relayer.decrypt(encryptedHandle);
// Result: 42 (the original plaintext)
```

## Handle Lifecycle

### Phase 1: Generation

```
User creates encrypted input
    ↓
FHEVM generates handle
    ↓
Handle returned to user as externalEuint32
```

### Phase 2: Transmission

```
Handle sent in transaction
    ↓
Proof validates handle binding
    ↓
Handle reaches contract
```

### Phase 3: Conversion

```
FHE.fromExternal(handle, proof)
    ↓
Validates proof
    ↓
Converts to internal euint32 (internal handle)
```

### Phase 4: Storage

```
euint32 value = FHE.fromExternal(...)
    ↓
Contract stores internal handle
    ↓
Data persists in contract state
```

### Phase 5: Computation

```
Operations using handles
    ↓
FHEVM computes on encrypted data
    ↓
New handles created for results
```

### Phase 6: Retrieval

```
Contract returns handle
    ↓
User receives external handle
    ↓
Relayer decrypts using handle
    ↓
User receives plaintext
```

## External vs Internal Handles

### External Handles (externalEuint32)

```typescript
// From client-side encryption
const { handles } = await input.encrypt();
// handles[0] is externalEuint32
// Format: optimized for transmission
// Type: Just bytes/numbers

const encrypted = {
  handles: [0x5a],  // External handle
  inputProof: [...],
}
```

### Internal Handles (euint32)

```solidity
// Inside contract after FHE.fromExternal
euint32 value = FHE.fromExternal(externalHandle, proof);
// value is euint32
// Represents encrypted data in contract context
// Type: Solidity euint type
```

### Conversion

```solidity
function receiveExternal(externalEuint32 handle, bytes calldata proof) external {
    // Conversion step
    euint32 internalHandle = FHE.fromExternal(handle, proof);
    // Now usable in contract operations
}
```

## Handle Properties

### Key Characteristics

1. **Opaque** - Handle itself reveals nothing about plaintext
2. **Unique** - Each encrypted value gets unique handle
3. **Bound** - Handle only works in correct contract context
4. **Ephemeral** - New handles created for intermediate operations
5. **Deterministic** - Same plaintext from same signer = same operation results

### What Handles DON'T Tell You

❌ What the plaintext value is
❌ Who encrypted it (without proof)
❌ What contract it belongs to (in external form)
❌ Whether two handles reference the same value
❌ The size or type of plaintext

### What Handles DO Enable

✅ Operations on encrypted data
✅ Storage of encrypted values
✅ Transmission without decryption
✅ Delegation to relayers for decryption
✅ Complex computation on ciphertexts

## Handle Management Patterns

### Pattern 1: Storing Handles

```solidity
mapping(address => euint32) private userSecrets;

function storeSecret(externalEuint32 secret, bytes calldata proof) external {
    // Create internal handle from external
    euint32 value = FHE.fromExternal(secret, proof);

    // Store internal handle
    userSecrets[msg.sender] = value;

    // Handle persists in contract state
}
```

### Pattern 2: Operating on Handles

```solidity
euint32 balance;

function addToBalance(externalEuint32 amount, bytes calldata proof) external {
    // Convert external to internal handle
    euint32 value = FHE.fromExternal(amount, proof);

    // Operate on handles
    balance = FHE.add(balance, value);

    // Result is new handle
}
```

### Pattern 3: Returning Handles

```solidity
function getBalance() external view returns (euint32) {
    // Return handle to encrypted balance
    return balance;
    // Caller receives external handle
}
```

```typescript
// Client receives external handle
const encryptedBalance = await contract.getBalance();

// Use with relayer for decryption
const plainBalance = await relayer.decrypt(encryptedBalance);
```

### Pattern 4: Handle Composition

```solidity
function complexComputation(
    externalEuint32 a, bytes calldata proofA,
    externalEuint32 b, bytes calldata proofB
) external returns (euint32) {
    // Convert inputs to internal handles
    euint32 valA = FHE.fromExternal(a, proofA);
    euint32 valB = FHE.fromExternal(b, proofB);

    // Operate on handles
    euint32 sum = FHE.add(valA, valB);
    euint32 product = FHE.mul(valA, valB);

    // Combine results (new handle)
    euint32 result = FHE.add(sum, product);

    // Return handle to final result
    return result;
}
```

## Symbolic Execution and Handles

### What is Symbolic Execution?

Symbolic execution means operations are performed **symbolically** (on encrypted data):

```
Regular execution:       Symbolic execution (FHE):
a = 5                   a = handle to encrypted 5
b = 3                   b = handle to encrypted 3
result = a + b          result = handle to encrypt(5 + 3)
// result = 8 (can see)  // result = handle (can't see plaintext)
```

### In Practice

```solidity
// These operations happen SYMBOLICALLY
euint32 encrypted5 = FHE.asEuint32(5);  // Handle to 5
euint32 encrypted3 = FHE.asEuint32(3);  // Handle to 3

// FHE computes symbolically
euint32 result = FHE.add(encrypted5, encrypted3);
// result = handle to encrypted 8
// No one learns 8 until someone decrypts

// Comparison happens symbolically
bool isGreater = FHE.gt(encrypted5, encrypted3);  // handle to true
// Boolean is also encrypted!
```

### Why It Matters

Symbolic execution means:
✅ No information leaks during computation
✅ Intermediate values stay encrypted
✅ Only final results can be decrypted
✅ Complete privacy of computation

## Handle Allocation and Cleanup

### Memory Management

Handles are allocated in the FHE execution environment:

```solidity
function multipleOperations(
    externalEuint32 a, bytes calldata proofA,
    externalEuint32 b, bytes calldata proofB,
    externalEuint32 c, bytes calldata proofC
) external {
    // Allocates 3 handles for inputs
    euint32 valA = FHE.fromExternal(a, proofA);
    euint32 valB = FHE.fromExternal(b, proofB);
    euint32 valC = FHE.fromExternal(c, proofC);

    // Allocates handles for intermediate results
    euint32 sum = FHE.add(valA, valB);
    euint32 product = FHE.mul(valB, valC);

    // Allocates handle for final result
    euint32 final = FHE.add(sum, product);

    // Store for later use
    result = final;
}
```

### Gas Considerations

```solidity
// More handles = more gas
euint32 temp1 = FHE.add(a, b);       // 1st intermediate handle
euint32 temp2 = FHE.mul(c, d);       // 2nd intermediate handle
euint32 temp3 = FHE.sub(e, f);       // 3rd intermediate handle
euint32 final = FHE.add(temp1, temp2); // 4th intermediate handle

// Each handle operations costs gas
// Reuse handles where possible to optimize

// Better: Chain operations
euint32 result = FHE.add(
    FHE.add(a, b),
    FHE.mul(c, d)
);
```

## Handle Type System

### Type Safety

Handles are type-safe:

```solidity
euint32 val32;
euint8 val8;

// ❌ Type mismatch - won't compile
euint32 result = FHE.add(val32, val8);

// ✅ Must cast
euint32 val8as32 = FHE.cast(val8, euint32);
euint32 result = FHE.add(val32, val8as32);
```

### Casting Handles

```solidity
function castExample(externalEuint32 value, bytes calldata proof) external {
    euint32 val32 = FHE.fromExternal(value, proof);

    // Cast to different type
    euint64 val64 = FHE.cast(val32, euint64);
    euint8 val8 = FHE.cast(val32, euint8);

    // Each cast creates new handle
}
```

## Handle Visibility

### Contract State Handles

```solidity
// Handles stored in contract state
euint32 private balance;  // Internal handle
mapping(address => euint32) private secrets;  // Multiple handles

// All persist in contract state
// Can be retrieved with getter functions
```

### Local Variable Handles

```solidity
function compute(externalEuint32 input, bytes calldata proof) external returns (euint32) {
    // Local variable handle (temporary)
    euint32 temp = FHE.fromExternal(input, proof);

    // Use in computation
    euint32 result = FHE.add(temp, FHE.asEuint32(10));

    // Return handle
    return result;
    // Temporary handle exists only during execution
}
```

## Common Handle Mistakes

### Mistake 1: Forgetting Type Conversion

```solidity
// ❌ WRONG - externalEuint32 isn't euint32
mapping(address => externalEuint32) private data;  // Don't do this!

// ✅ CORRECT - Store internal handles
mapping(address => euint32) private data;

function set(externalEuint32 value, bytes calldata proof) external {
    data[msg.sender] = FHE.fromExternal(value, proof);  // Convert!
}
```

### Mistake 2: Mixing Handle Types

```solidity
// ❌ WRONG - Can't directly operate on different encrypted types
euint32 val32 = ...;
euint8 val8 = ...;
euint32 result = FHE.add(val32, val8);  // Compilation error!

// ✅ CORRECT - Cast first
euint32 val8as32 = FHE.cast(val8, euint32);
euint32 result = FHE.add(val32, val8as32);
```

### Mistake 3: Assuming Handle Equality

```solidity
// ❌ WRONG - Can't compare handles directly
euint32 val1 = ...;
euint32 val2 = ...;
if (val1 == val2) {  // Won't work with encrypted handles!
    // ...
}

// ✅ CORRECT - Use FHE comparison
bool isEqual = FHE.eq(val1, val2);  // Returns encrypted boolean
```

## Best Practices

### DO:

✅ Always convert external handles with FHE.fromExternal
✅ Store internal handles in contract state
✅ Use type-safe handle operations
✅ Grant proper permissions for handles
✅ Return handles for external decryption

### DON'T:

❌ Store external handles directly
❌ Mix encrypted types without casting
❌ Assume you can see handle values
❌ Reuse handles across contexts
❌ Forget to grant FHE permissions

## Summary

**Handles are:**
- ✅ References to encrypted values
- ✅ Opaque (reveal nothing about plaintext)
- ✅ Type-safe in Solidity
- ✅ Composable in operations
- ✅ Essential for FHE computation

**Key Points:**
- External handles transmitted from client
- Internal handles used in contract
- Handles support all FHE operations
- Symbolic execution keeps data encrypted
- Proper type casting required

**Result:** Secure, privacy-preserving computation on encrypted data!

---

## See Also

- [Input Proofs Guide](./input-proofs.md)
- [Permission Management](./permissions.md)
- [SimpleMembership](../examples/basic-member.md) - Uses handles throughout

