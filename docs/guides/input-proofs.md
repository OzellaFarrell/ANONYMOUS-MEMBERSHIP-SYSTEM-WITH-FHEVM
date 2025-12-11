# Input Proofs in FHEVM

## Overview

Input proofs are zero-knowledge proofs that verify encrypted inputs were created correctly and are bound to the correct contract and user. They are essential for security and privacy.

## What Are Input Proofs?

Input proofs are cryptographic proofs that:

1. **Validate Encryption Binding** - Prove the value was encrypted for `[contract, user]` pair
2. **Prevent Tampering** - Ensure the encrypted value hasn't been modified
3. **Verify Signer** - Confirm the user who encrypted the value
4. **Enable Decryption** - Establish permission for the user to decrypt later

## Why Are They Needed?

### Security Guarantees

**Without input proofs:**
- ❌ Anyone could submit encrypted values claiming they're from someone else
- ❌ Encrypted values could be replayed across contracts
- ❌ Users couldn't verify they encrypted the data
- ❌ Smart contracts couldn't trust encrypted inputs

**With input proofs:**
- ✅ Only correct [contract, user] pairs accepted
- ✅ Values bound to specific contract and user
- ✅ Impossible to forge or replay
- ✅ Zero-knowledge verification

## How Input Proofs Work

### Step 1: Client-Side Encryption

The user encrypts data locally:

```typescript
const encryptedInput = await account.createEncryptedInput(
  contractAddress,    // Bind to this contract
  account.address      // Bind to this user
);
encryptedInput.add32(secretValue);
const encrypted = await encryptedInput.encrypt();
// Returns: { handles: [...], inputProof: [...] }
```

### Step 2: Proof Generation

The encryption process creates:
- **Encrypted Value** - The ciphertext handle
- **Zero-Knowledge Proof** - Proof of correct encryption binding

```typescript
const encrypted = {
  handles: [handle1, handle2, ...],    // Encrypted values
  inputProof: proofBytes                // ZK proof
}
```

### Step 3: On-Chain Verification

The contract receives both and validates:

```solidity
function setSecret(externalEuint32 encryptedValue, bytes calldata proof) external {
    // FHE.fromExternal automatically verifies:
    // 1. Proof is valid
    // 2. Value encrypted for [this contract, msg.sender]
    // 3. Proof hasn't been tampered with
    euint32 value = FHE.fromExternal(encryptedValue, proof);

    // Now we trust the value came from msg.sender
    secrets[msg.sender] = value;
}
```

## Proof Binding

### Encryption Binding Mechanism

```
EncryptedValue = Encrypt(plaintext, CONTRACT, USER)
Proof = GenerateProof(plaintext, CONTRACT, USER)

On-chain verification:
Verify(EncryptedValue, Proof, CONTRACT, msg.sender)
  → Returns true if all three match
  → Rejects if CONTRACT or msg.sender don't match
```

### Key Property: Binding is Strict

```typescript
// Alice encrypts with Bob's contract
const encrypted = await alice.createEncryptedInput(
  bobContractAddress,
  alice.address
);

// Bob tries to use it in his contract
await bobContract.someFunction(encrypted.handles[0], encrypted.inputProof);
// ❌ FAILS - inputProof only valid for Alice's encryption parameters
```

## Common Patterns

### Pattern 1: Single Encrypted Value

```solidity
function setSecret(externalEuint32 encryptedSecret, bytes calldata proof) external {
    // Validate and convert in one step
    euint32 secret = FHE.fromExternal(encryptedSecret, proof);

    // Now we know:
    // 1. Proof is cryptographically valid
    // 2. Value encrypted for [this contract, msg.sender]
    // 3. msg.sender provided the proof

    secrets[msg.sender] = secret;
}
```

### Pattern 2: Multiple Values

```typescript
// Client-side: Create proof for multiple values
const input = await account.createEncryptedInput(contractAddr, account.address);
input.add32(value1);
input.add32(value2);
input.add8(value3);
const { handles, inputProof } = await input.encrypt();

// Important: ONE proof for ALL values in the input
```

```solidity
// On-chain: Verify multiple values with same proof
function setMultiple(
    externalEuint32 val1, externalEuint32 val2,
    externalEuint8 val3,
    bytes calldata proof
) external {
    // All values from same encrypted input
    euint32 value1 = FHE.fromExternal(val1, proof);
    euint32 value2 = FHE.fromExternal(val2, proof);
    euint8 value3 = FHE.fromExternal(val3, proof);

    // All three are now trusted
}
```

### Pattern 3: Re-encrypting with Permission

```solidity
// After accepting an input, contract might re-encrypt for storage
function storeAndDecrypt(externalEuint32 secret, bytes calldata proof) external {
    // Verify input (requires caller's proof)
    euint32 value = FHE.fromExternal(secret, proof);

    // Store encrypted
    secrets[msg.sender] = value;

    // Grant permissions so user can decrypt later
    FHE.allowThis(secrets[msg.sender]);
    FHE.allow(secrets[msg.sender], msg.sender);
}
```

## Security Considerations

### ✅ DO:

- ✅ Always include inputProof when calling FHE.fromExternal
- ✅ Verify proof for each external encrypted value
- ✅ Ensure encryption was done for correct contract
- ✅ Match caller (msg.sender) to encryption signer
- ✅ Use strict equality for addresses in encryption

### ❌ DON'T:

- ❌ Accept external encrypted values without proof
- ❌ Trust encryption without verification
- ❌ Reuse proofs across contracts
- ❌ Skip proof validation for performance
- ❌ Allow proof tampering (treat as untrusted input)

## Proof Lifecycle

### 1. Creation (Client)
```
User creates encrypted input with contract + user address
↓
Generates zero-knowledge proof
↓
Returns handles + proof bytes
```

### 2. Transmission
```
Client sends to blockchain:
- Encrypted value handles
- Zero-knowledge proof bytes
(Proof proves correct binding)
```

### 3. Verification (Contract)
```
Contract receives handles + proof
↓
Calls FHE.fromExternal(handle, proof)
↓
Validates proof cryptographically
↓
Confirms [contract, msg.sender] binding
↓
Returns trusted euint value
```

### 4. Storage & Decryption
```
Encrypted value stored in contract
↓
User can decrypt (has permission)
↓
Off-chain decryption via relayer
↓
User receives plaintext
```

## Common Mistakes

### Mistake 1: Wrong Contract Address

```typescript
// ❌ WRONG
const encrypted = await user.createEncryptedInput(
  wrongContractAddress,    // Oops!
  user.address
);
await correctContract.setSecret(encrypted.handles[0], encrypted.inputProof);
// Result: Proof verification fails!

// ✅ CORRECT
const encrypted = await user.createEncryptedInput(
  correctContract.address,  // Must match!
  user.address
);
```

### Mistake 2: Wrong User

```typescript
// ❌ WRONG
const encrypted = await alice.createEncryptedInput(
  contract.address,
  alice.address
);
await contract.connect(bob).setSecret(encrypted.handles[0], encrypted.inputProof);
// Result: Proof fails - msg.sender (bob) != encryption user (alice)

// ✅ CORRECT
const encrypted = await bob.createEncryptedInput(
  contract.address,
  bob.address
);
await contract.connect(bob).setSecret(encrypted.handles[0], encrypted.inputProof);
// Result: Success - msg.sender (bob) == encryption user (bob)
```

### Mistake 3: Reusing Proof

```typescript
// ❌ WRONG
const encrypted = await user.createEncryptedInput(
  contract.address,
  user.address
);
await contractA.setSecret(encrypted.handles[0], encrypted.inputProof);
await contractB.setSecret(encrypted.handles[0], encrypted.inputProof);
// Result: Second call fails - proof only valid for contractA

// ✅ CORRECT
// Create separate encrypted inputs for each contract
const encA = await user.createEncryptedInput(contractA.address, user.address);
const encB = await user.createEncryptedInput(contractB.address, user.address);
await contractA.setSecret(encA.handles[0], encA.inputProof);
await contractB.setSecret(encB.handles[0], encB.inputProof);
```

### Mistake 4: Forgetting Proof

```solidity
// ❌ WRONG - No proof verification!
function setSecret(externalEuint32 encryptedSecret) external {
    // This doesn't verify anything - anyone can claim values are theirs
    euint32 secret = euint32.wrap(uint256(encryptedSecret));
    secrets[msg.sender] = secret;
}

// ✅ CORRECT - With proof verification
function setSecret(externalEuint32 encryptedSecret, bytes calldata proof) external {
    // Proof verifies binding before accepting
    euint32 secret = FHE.fromExternal(encryptedSecret, proof);
    secrets[msg.sender] = secret;
}
```

## Understanding Proof Format

### Proof Structure

```typescript
// inputProof is bytes containing:
// 1. Encryption scheme identifier
// 2. Public parameters
// 3. Zero-knowledge proof components
// 4. Binding verification data
```

### Size Considerations

```typescript
// Proofs are typically 100-300 bytes
// Included in transaction data
// Adds gas cost for verification
// Cost is worth the security guarantee
```

## Proof Verification Process (Technical Details)

### For the Curious

Input proof verification checks:

1. **Proof Format** - Valid ZK proof structure
2. **Scheme Match** - Proof uses same scheme as value
3. **Binding Verification** - Contract address matches
4. **Signer Verification** - msg.sender matches encryption signer
5. **Non-Replay** - Proof fresh (hasn't been used before)

This all happens in `FHE.fromExternal()` automatically.

## Best Practices

### 1. Always Get a Fresh Proof

```typescript
// ✅ Create new encrypted input for each call
const input = await account.createEncryptedInput(
  contractAddress,
  account.address
);
input.add32(value);
const { handles, inputProof } = await input.encrypt();
// Use immediately or store proof temporarily
```

### 2. Validate in Contract

```solidity
// ✅ Always verify proof
function acceptValue(externalEuint32 encrypted, bytes calldata proof) external {
    // This line validates the proof
    euint32 value = FHE.fromExternal(encrypted, proof);
    // Now safe to use value
}
```

### 3. Document Proof Requirements

```solidity
/**
 * @notice Store encrypted secret
 * @param encryptedSecret Encrypted secret (created client-side)
 * @param inputProof Proof of correct encryption binding
 * @dev Proof must be generated with:
 *      - Contract: this address
 *      - User: msg.sender
 *      - Value: encryptedSecret
 */
function storeSecret(externalEuint32 encryptedSecret, bytes calldata inputProof) external
```

## Testing with Proofs

### Test Example

```typescript
describe("InputProof", function () {
  it("should accept valid proof", async function () {
    const account = accounts[0];

    // Create proof with correct parameters
    const input = await account.createEncryptedInput(
      await contract.getAddress(),
      account.address  // Matches msg.sender
    );
    input.add32(42);
    const { handles, inputProof } = await input.encrypt();

    // Should succeed
    await contract.setSecret(handles[0], inputProof);
  });

  it("should reject wrong address", async function () {
    const alice = accounts[0];
    const bob = accounts[1];

    // Alice creates proof
    const input = await alice.createEncryptedInput(
      await contract.getAddress(),
      alice.address
    );
    input.add32(42);
    const { handles, inputProof } = await input.encrypt();

    // Bob tries to use it
    // Should fail - msg.sender (bob) != signer (alice)
    await expect(
      contract.connect(bob).setSecret(handles[0], inputProof)
    ).to.be.revertedWith("proof validation failed");
  });
});
```

## Summary

**Input proofs are:**
- ✅ Cryptographic guarantees of correct encryption
- ✅ Binding encrypted values to contract + user
- ✅ Essential for security
- ✅ Automatically verified by FHE.fromExternal()

**Key Rules:**
- Encrypt for the correct [contract, user] pair
- Always include proof with encrypted values
- Never reuse proofs across contracts
- Trust only verified encrypted values

**Result:** Only legitimate encrypted values from authorized users are accepted by your contracts!

---

## See Also

- [SimpleMembership.sol](../examples/basic-member.md) - Uses input proofs
- [EncryptSingleValue.sol](../examples/encrypt-single-value.md) - Input validation
- [CommonPitfalls.sol](../examples/common-pitfalls.md) - Proof mistakes to avoid

