# Common Anti-Patterns and Mistakes in FHEVM

This guide covers common mistakes when working with FHEVM and how to avoid them.

---

## Anti-Pattern 1: Missing FHE.allowThis()

### ❌ Wrong

```solidity
function storeValue(externalEuint32 encryptedValue, bytes calldata proof) external {
  euint32 value = FHE.fromExternal(encryptedValue, proof);
  userValues[msg.sender] = value;

  // ❌ Missing FHE.allowThis()
  FHE.allow(value, msg.sender);  // Only user permission
}
```

**Problem**: Contract cannot use the encrypted value in future operations.

### ✅ Correct

```solidity
function storeValue(externalEuint32 encryptedValue, bytes calldata proof) external {
  euint32 value = FHE.fromExternal(encryptedValue, proof);
  userValues[msg.sender] = value;

  // ✅ Grant both permissions
  FHE.allowThis(value);        // Contract permission
  FHE.allow(value, msg.sender); // User permission
}
```

---

## Anti-Pattern 2: View Functions with Encrypted Values

### ❌ Wrong

```solidity
function getBalance() external view returns (euint32) {
  return balances[msg.sender];  // ❌ View function cannot return encrypted
}
```

**Problem**: View functions modify state during FHE operations, causing compilation errors or runtime issues.

### ✅ Correct (Option 1: Non-View)

```solidity
function getBalance() external returns (euint32) {
  return balances[msg.sender];  // ✅ Non-view function
}
```

### ✅ Correct (Option 2: Store with allowThis)

```solidity
function getBalance() external view returns (euint32) {
  // If already granted allowThis during storage, can return
  return balances[msg.sender];  // ✅ Works if permissions set
}
```

---

## Anti-Pattern 3: Missing Input Proofs

### ❌ Wrong

```solidity
function transfer(euint32 amount) external {
  // ❌ No input proof validation!
  balances[msg.sender] = FHE.sub(balances[msg.sender], amount);
}
```

**Problem**: No verification that encrypted value is valid or properly bound.

### ✅ Correct

```solidity
function transfer(externalEuint32 amount, bytes calldata inputProof) external {
  // ✅ Verify proof before using
  euint32 value = FHE.fromExternal(amount, inputProof);
  balances[msg.sender] = FHE.sub(balances[msg.sender], value);
}
```

---

## Anti-Pattern 4: Comparing Encrypted with Plain Values

### ❌ Wrong

```solidity
function checkMembership() external view returns (bool) {
  // ❌ Cannot compare euint32 with plain integer
  return memberStatus[msg.sender] == 0;
}
```

**Problem**: Encrypted types cannot be compared with plain values.

### ✅ Correct (Option 1: Separate Flag)

```solidity
mapping(address => bool) public isMember;
mapping(address => euint32) private memberStatus;

function checkMembership() external view returns (bool) {
  // ✅ Use plaintext flag for membership check
  return isMember[msg.sender];
}
```

### ✅ Correct (Option 2: FHE Comparison)

```solidity
function checkMembership() external returns (ebool) {
  // ✅ Compare with encrypted zero
  euint32 zero = FHE.asEuint32(0);
  ebool isNotZero = FHE.ne(memberStatus[msg.sender], zero);
  FHE.allowThis(isNotZero);
  FHE.allow(isNotZero, msg.sender);
  return isNotZero;
}
```

---

## Anti-Pattern 5: Deleting Encrypted Values

### ❌ Wrong

```solidity
function clearSecret() external {
  // ❌ Cannot delete encrypted types
  delete userSecrets[msg.sender];
}
```

**Problem**: `delete` operator doesn't work with encrypted types.

### ✅ Correct

```solidity
function clearSecret() external {
  // ✅ Set to zero instead
  userSecrets[msg.sender] = FHE.asEuint32(0);
  FHE.allowThis(userSecrets[msg.sender]);
}
```

---

## Anti-Pattern 6: Wrong Constructor Parameter Type

### ❌ Wrong

```solidity
constructor(externalEuint32 value, bytes calldata proof) {
  // ❌ Constructors cannot use calldata
  initialValue = FHE.fromExternal(value, proof);
}
```

**Problem**: Constructors don't support `calldata` for bytes parameters.

### ✅ Correct

```solidity
constructor(externalEuint32 value, bytes memory proof) {
  // ✅ Use memory in constructors
  initialValue = FHE.fromExternal(value, proof);
  FHE.allowThis(initialValue);
}
```

---

## Anti-Pattern 7: Returning bool from Encrypted Comparisons

### ❌ Wrong

```solidity
function isGreater(externalEuint32 value, bytes calldata proof)
  external
  returns (bool)
{
  euint32 encValue = FHE.fromExternal(value, proof);
  // ❌ FHE.gt returns ebool, not bool
  return FHE.gt(encValue, threshold);
}
```

**Problem**: FHE comparison operations return `ebool` (encrypted boolean), not plain `bool`.

### ✅ Correct

```solidity
function isGreater(externalEuint32 value, bytes calldata proof)
  external
  returns (ebool)
{
  euint32 encValue = FHE.fromExternal(value, proof);
  // ✅ Return ebool
  ebool result = FHE.gt(encValue, threshold);
  FHE.allowThis(result);
  FHE.allow(result, msg.sender);
  return result;
}
```

---

## Anti-Pattern 8: Mismatched Signer and Caller

### ❌ Wrong

```typescript
// Alice creates proof
const input = await fhevm.createEncryptedInput(contractAddr, alice.address);
const { handles, inputProof } = await input.encrypt();

// Bob submits
await contract.connect(bob).deposit(handles[0], inputProof);
// ❌ Will fail - signer mismatch
```

**Problem**: Proof is bound to Alice, but Bob is trying to submit.

### ✅ Correct

```typescript
// Alice creates and submits
const input = await fhevm.createEncryptedInput(contractAddr, alice.address);
const { handles, inputProof } = await input.encrypt();

await contract.connect(alice).deposit(handles[0], inputProof);
// ✅ Signer matches
```

---

## Anti-Pattern 9: Storing External Types

### ❌ Wrong

```solidity
mapping(address => externalEuint32) private userValues;

function store(externalEuint32 value, bytes calldata proof) external {
  // ❌ Cannot store externalEuint32 directly
  userValues[msg.sender] = value;
}
```

**Problem**: `externalEuint32` is for input only, cannot be stored.

### ✅ Correct

```solidity
mapping(address => euint32) private userValues;

function store(externalEuint32 value, bytes calldata proof) external {
  // ✅ Convert to internal euint32 before storing
  euint32 internalValue = FHE.fromExternal(value, proof);
  userValues[msg.sender] = internalValue;
  FHE.allowThis(internalValue);
  FHE.allow(internalValue, msg.sender);
}
```

---

## Anti-Pattern 10: Arithmetic on Encrypted Without Permissions

### ❌ Wrong

```solidity
function transfer(address to, externalEuint32 amount, bytes calldata proof) external {
  euint32 value = FHE.fromExternal(amount, proof);

  balances[msg.sender] = FHE.sub(balances[msg.sender], value);
  balances[to] = FHE.add(balances[to], value);

  // ❌ No permissions granted on new balances
}
```

**Problem**: Updated balances don't have proper permissions.

### ✅ Correct

```solidity
function transfer(address to, externalEuint32 amount, bytes calldata proof) external {
  euint32 value = FHE.fromExternal(amount, proof);

  balances[msg.sender] = FHE.sub(balances[msg.sender], value);
  balances[to] = FHE.add(balances[to], value);

  // ✅ Grant permissions on updated values
  FHE.allowThis(balances[msg.sender]);
  FHE.allowThis(balances[to]);
  FHE.allow(balances[msg.sender], msg.sender);
  FHE.allow(balances[to], to);
}
```

---

## Testing for Anti-Patterns

```typescript
describe("Anti-Pattern Tests", function () {
  it("should fail without allowThis", async function () {
    // Test that operations fail without proper permissions
  });

  it("should reject mismatched signer", async function () {
    const [alice, bob] = await ethers.getSigners();

    const input = await fhevm.createEncryptedInput(addr, alice.address);
    const { handles, inputProof } = await input.encrypt();

    await expect(
      contract.connect(bob).deposit(handles[0], inputProof)
    ).to.be.reverted;
  });

  it("should require input proof", async function () {
    // Test that functions properly validate proofs
  });
});
```

---

## Quick Reference Checklist

When writing FHEVM contracts, verify:

- [ ] All encrypted inputs have `bytes calldata inputProof` parameter
- [ ] Using `FHE.fromExternal()` to verify proofs
- [ ] Calling both `FHE.allowThis()` and `FHE.allow()` after creating/modifying encrypted values
- [ ] Not using `view` for functions that work with encrypted values
- [ ] Returning `ebool` from encrypted comparisons, not `bool`
- [ ] Using `bytes memory` in constructors, not `calldata`
- [ ] Not comparing encrypted values with plain integers directly
- [ ] Storing `euint32` not `externalEuint32`
- [ ] Creating fresh proofs for each transaction
- [ ] Signer address matches transaction sender

---

## Related Documentation

- [Input Proofs Guide](./input-proofs.md)
- [Understanding Handles](./handles.md)
- [FHE Permissions](./permissions.md)

---

**Last Updated**: December 2025
