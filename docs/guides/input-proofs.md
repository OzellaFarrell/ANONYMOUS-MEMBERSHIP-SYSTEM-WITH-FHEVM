# Input Proofs in FHEVM

## What are Input Proofs?

Input proofs are zero-knowledge proofs that verify the correctness of encrypted inputs without revealing the underlying plaintext values. They are a critical component of FHEVM's security model.

---

## Why Are Input Proofs Needed?

### The Problem Without Input Proofs

Without input proofs, malicious users could:
- Send invalid encrypted data
- Manipulate ciphertext
- Break encryption binding

### The Solution: Input Proofs

Input proofs provide cryptographic guarantees that:

1. **Encryption is valid** - Ciphertext was properly generated
2. **Binding is correct** - Value is bound to [contract, user] pair
3. **Value is authentic** - User actually knows the plaintext
4. **No tampering** - Ciphertext hasn't been modified

---

## How Input Proofs Work

### Encryption Binding Model

FHEVM uses an encryption binding where values are bound to specific pairs:

```
Encrypted Value = Encrypt(plaintext, [contractAddress, userAddress])
```

**This means:**
- Values encrypted for Contract A cannot be used in Contract B
- Values encrypted by User 1 cannot be submitted by User 2
- Each encrypted value is uniquely bound to a specific context

---

## Using Input Proofs Correctly

### ✅ Correct Pattern

```solidity
function storeSecret(
  externalEuint32 encryptedSecret,
  bytes calldata inputProof
) external {
  // ✅ Convert with proof verification
  euint32 secret = FHE.fromExternal(encryptedSecret, inputProof);

  // Store the verified encrypted value
  userSecrets[msg.sender] = secret;

  // Grant permissions
  FHE.allowThis(secret);
  FHE.allow(secret, msg.sender);
}
```

### ❌ Common Mistake: Missing Proof

```solidity
function storeSecret(euint32 encryptedSecret) external {
  // ❌ NO PROOF VERIFICATION!
  // User could send invalid/malicious encrypted data
  userSecrets[msg.sender] = encryptedSecret;
}
```

### ❌ Common Mistake: Wrong Signer

```typescript
// Alice creates proof
const input = await fhevm.createEncryptedInput(contractAddress, alice.address);
const { handles, inputProof } = await input.encrypt();

// ❌ Bob tries to use Alice's proof
await contract.connect(bob).deposit(handles[0], inputProof);
// This will FAIL - proof is bound to Alice
```

### ✅ Correct: Matching Signer

```typescript
// ✅ Alice creates AND submits her own proof
const input = await fhevm.createEncryptedInput(contractAddress, alice.address);
const { handles, inputProof } = await input.encrypt();

await contract.connect(alice).deposit(handles[0], inputProof);
// ✅ Works - Alice is both creator and submitter
```

---

## Input Proof API

### Creating Encrypted Input (Client-Side)

```typescript
const input = await fhevm.createEncryptedInput(
  contractAddress,  // Target contract
  userAddress       // User creating the input
);

input.add8(value8);      // euint8
input.add16(value16);    // euint16
input.add32(value32);    // euint32
input.add64(value64);    // euint64
input.addBool(valueBool); // ebool

const { handles, inputProof } = await input.encrypt();
```

### Verifying Input Proof (Contract-Side)

```solidity
function processInput(
  externalEuint32 encryptedValue,
  bytes calldata inputProof
) external {
  // Verify and convert
  euint32 value = FHE.fromExternal(encryptedValue, inputProof);

  // Now value is verified and can be used safely
  _processValue(value);
}
```

---

## Multiple Values with Single Proof

You can batch multiple encrypted values with one proof:

### Client-Side

```typescript
const input = await fhevm.createEncryptedInput(contractAddress, userAddress);

input.add32(amount);      // handles[0]
input.add8(tier);         // handles[1]
input.add32(score);       // handles[2]

const { handles, inputProof } = await input.encrypt();

await contract.registerMember(
  handles[0],  // amount
  handles[1],  // tier
  handles[2],  // score
  inputProof   // proves all three
);
```

### Contract-Side

```solidity
function registerMember(
  externalEuint32 encryptedAmount,
  externalEuint8 encryptedTier,
  externalEuint32 encryptedScore,
  bytes calldata inputProof
) external {
  euint32 amount = FHE.fromExternal(encryptedAmount, inputProof);
  euint8 tier = FHE.fromExternal(encryptedTier, inputProof);
  euint32 score = FHE.fromExternal(encryptedScore, inputProof);

  _registerMember(amount, tier, score);
}
```

---

## What Input Proofs Guarantee

✅ **Encryption Validity** - Ciphertext is well-formed
✅ **Binding Correctness** - Value bound to specific [contract, user]
✅ **User Knowledge** - Proof creator knows the plaintext
✅ **Integrity** - Ciphertext hasn't been modified

---

## Best Practices

1. **Always Require Proofs** - Never accept euint without proof
2. **Match Signer and Caller** - Creator address must match caller
3. **Use Memory in Constructors** - Use `bytes memory` not calldata
4. **Document Requirements** - Clearly state proof requirements
5. **Test Thoroughly** - Test valid and invalid proofs

---

## Security Checklist

- [ ] Function takes `bytes calldata inputProof` parameter
- [ ] Uses `FHE.fromExternal()` to verify proof
- [ ] Signer address matches `msg.sender`
- [ ] Constructor uses `bytes memory` (not calldata)
- [ ] Documented proof requirements
- [ ] Tested with valid and invalid proofs

---

**Last Updated**: December 2025
