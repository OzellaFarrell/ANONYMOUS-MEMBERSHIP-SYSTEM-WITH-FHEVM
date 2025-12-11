# Permission Management in FHEVM

## Overview

FHEVM uses a two-tier permission system to control who can decrypt encrypted values. Both permissions must be granted for decryption to work.

## The Two Permissions

### 1. Contract Permission (FHE.allowThis)

**Purpose**: Allows the smart contract to decrypt values

```solidity
FHE.allowThis(encryptedValue);
```

**What it does**:
- Grants the contract permission to decrypt
- Allows the contract to perform operations on encrypted data
- Necessary for contract logic that needs decryption

**When to use**:
- When contract needs to access encrypted values
- After storing encrypted data
- When performing computation on encrypted values

### 2. User Permission (FHE.allow)

**Purpose**: Allows a specific user to decrypt their values

```solidity
FHE.allow(encryptedValue, userAddress);
```

**What it does**:
- Grants a specific user permission to decrypt
- Allows the user to retrieve their plaintext via relayer
- Can be granted to multiple users

**When to use**:
- When user creates encrypted data
- After storing user's encrypted values
- When user should be able to decrypt

## The Critical Rule

### ✅ ALWAYS Grant Both Permissions

```solidity
// Store encrypted value
userData[user] = FHE.fromExternal(encrypted, proof);

// ✅ CRITICAL: Grant BOTH permissions
FHE.allowThis(userData[user]);           // Contract permission
FHE.allow(userData[user], user);         // User permission

// Now:
// - Contract can read/operate on the value
// - User can decrypt via relayer
```

### ❌ MISTAKE: Missing FHE.allowThis

```solidity
function storeSecret(externalEuint32 secret, bytes calldata proof) external {
    euint32 value = FHE.fromExternal(secret, proof);
    secrets[msg.sender] = value;

    // ❌ WRONG: Only user permission
    FHE.allow(secrets[msg.sender], msg.sender);

    // Contract CANNOT decrypt this value!
    // This breaks any contract logic needing to read it
}
```

### ❌ MISTAKE: Missing FHE.allow

```solidity
function storeSecret(externalEuint32 secret, bytes calldata proof) external {
    euint32 value = FHE.fromExternal(secret, proof);
    secrets[msg.sender] = value;

    // ❌ WRONG: Only contract permission
    FHE.allowThis(secrets[msg.sender]);

    // User CANNOT decrypt their own secret!
    // User can't retrieve plaintext via relayer
}
```

## Permission Patterns

### Pattern 1: User-Only Readable Values

```solidity
// User encrypts value, only they can decrypt it
function storePersonalSecret(externalEuint32 secret, bytes calldata proof) external {
    euint32 value = FHE.fromExternal(secret, proof);
    personal_secrets[msg.sender] = value;

    // Contract permission (needed for storage/operations)
    FHE.allowThis(personal_secrets[msg.sender]);

    // User permission (user can decrypt)
    FHE.allow(personal_secrets[msg.sender], msg.sender);

    // Result: User can decrypt, contract can manage
}
```

### Pattern 2: Public-Readable Values

```solidity
// Values anyone can decrypt
function publishEncryptedValue(externalEuint32 value, bytes calldata proof) external {
    euint32 encrypted = FHE.fromExternal(value, proof);
    public_data = encrypted;

    // Contract permission
    FHE.allowThis(public_data);

    // Grant permission to anyone who needs it
    FHE.allow(public_data, address(0));  // Depends on implementation
    // Or grant permission individually as needed

    // Result: Publicly accessible encrypted data
}
```

### Pattern 3: Shared Access

```solidity
// Multiple users can decrypt same value
function shareEncryptedData(
    externalEuint32 data,
    bytes calldata proof,
    address[] memory allowedUsers
) external {
    euint32 encrypted = FHE.fromExternal(data, proof);
    shared_data = encrypted;

    // Contract permission
    FHE.allowThis(shared_data);

    // Grant permission to authorized users
    for (uint i = 0; i < allowedUsers.length; i++) {
        FHE.allow(shared_data, allowedUsers[i]);
    }

    // Result: Only authorized users can decrypt
}
```

### Pattern 4: Transient Permissions

```solidity
// Temporary permission that expires
function temporaryAccess(
    externalEuint32 secret,
    bytes calldata proof,
    address user,
    uint expirationBlock
) external {
    euint32 value = FHE.fromExternal(secret, proof);
    temp_secrets[user] = value;

    // Contract permission
    FHE.allowThis(temp_secrets[user]);

    // Time-limited user permission
    if (block.number < expirationBlock) {
        FHE.allowTransient(temp_secrets[user], user);
    }

    // Result: User can decrypt only until block X
}
```

## FHE.allow vs FHE.allowTransient

### FHE.allow - Permanent Permission

```solidity
FHE.allow(value, user);
```

**Characteristics**:
- ✅ Persistent permission
- ✅ Granted once, valid forever (until revoked)
- ✅ No time limits
- ✅ Works for user's future decryption requests

**Use when**:
- Storing user's own data
- Creating permanent access
- No need for time-limited access

### FHE.allowTransient - Temporary Permission

```solidity
FHE.allowTransient(value, user);
```

**Characteristics**:
- ✅ Temporary permission
- ✅ Valid only for current block/context
- ✅ Automatically expires
- ⚠️ May require specific conditions

**Use when**:
- Temporary access needed
- Single-transaction use
- Time-limited decryption window

## Permission Lifecycle

### Phase 1: Value Creation

```solidity
// User sends encrypted value
function receive(externalEuint32 encrypted, bytes calldata proof) external {
    // Value is now in contract
    euint32 value = FHE.fromExternal(encrypted, proof);
}
```

### Phase 2: Permission Grant

```solidity
function storeAndGrant(externalEuint32 encrypted, bytes calldata proof) external {
    euint32 value = FHE.fromExternal(encrypted, proof);

    // Store value
    stored[msg.sender] = value;

    // Grant permissions
    FHE.allowThis(stored[msg.sender]);         // Step 1: Contract
    FHE.allow(stored[msg.sender], msg.sender); // Step 2: User
}
```

### Phase 3: Contract Operations

```solidity
function compute() external {
    // Contract can read (has FHE.allowThis)
    euint32 value = stored[caller];

    // Compute on encrypted data
    euint32 result = FHE.add(value, FHE.asEuint32(10));

    // Store result
    results[caller] = result;

    // Grant permissions on result
    FHE.allowThis(results[caller]);
    FHE.allow(results[caller], caller);
}
```

### Phase 4: User Decryption

```typescript
// User requests decryption via relayer
const encryptedValue = await contract.getValue(userAddress);

// Relayer verifies FHE.allow permission exists
const permission = await contract.checkPermission(encryptedValue, userAddress);

// Relayer decrypts (user must have permission)
const plaintext = await relayer.decrypt(encryptedValue);
// Success only if FHE.allow(encryptedValue, userAddress) was granted
```

## Common Permission Patterns

### Pattern: Store + Grant Immediately

```solidity
function setEncryptedBalance(externalEuint32 balance, bytes calldata proof) external {
    euint32 encrypted = FHE.fromExternal(balance, proof);

    // Store
    balances[msg.sender] = encrypted;

    // Grant permissions immediately
    FHE.allowThis(balances[msg.sender]);
    FHE.allow(balances[msg.sender], msg.sender);
}
```

### Pattern: Batch Permission Grant

```solidity
function grantPermissionsForAll() external {
    // Grant contract permission for all stored values
    FHE.allowThis(balance);
    FHE.allowThis(score);
    FHE.allowThis(data);

    // Grant user permissions
    FHE.allow(balance, msg.sender);
    FHE.allow(score, msg.sender);
    FHE.allow(data, msg.sender);
}
```

### Pattern: Conditional Permission

```solidity
function grantConditionalAccess(address recipient, uint amount) external {
    if (amount > 1000) {
        // Only grant for large amounts
        FHE.allow(secret_data, recipient);
    }
}
```

## Permission Security Model

### Access Control

```
Encrypted Value
├─ FHE.allowThis
│  └─ Contract can read/operate
│     └─ Contract logic can use value
│
└─ FHE.allow(value, user)
   └─ User can decrypt via relayer
      └─ User gets plaintext
```

### Security Properties

✅ **Authorization** - Only grant to authorized parties
✅ **Granularity** - Grant per-value, per-user
✅ **Auditability** - Permissions are on-chain, auditable
✅ **Revocability** - Permissions stay granted (no revocation)

## Permission with Multiple Users

### Multiple Decryptors

```solidity
function allowMultipleUsers(
    euint32 value,
    address[] memory users
) external {
    // Grant contract access
    FHE.allowThis(value);

    // Grant each user access
    for (uint i = 0; i < users.length; i++) {
        FHE.allow(value, users[i]);
    }

    // Each user can now decrypt independently
}
```

### Add User Over Time

```solidity
function grantAccessToNewUser(euint32 value, address newUser) external {
    // Can add permissions incrementally
    FHE.allow(value, newUser);

    // New user can now decrypt
}
```

## Permission Best Practices

### DO:

✅ Always grant FHE.allowThis for contract operations
✅ Always grant FHE.allow for users who created data
✅ Grant permissions immediately after storing
✅ Use FHE.allowTransient for temporary access
✅ Document permission requirements
✅ Verify permissions in contracts

### DON'T:

❌ Forget either permission type
❌ Assume permissions are inherited
❌ Grant unnecessary permissions
❌ Store unencrypted sensitive data
❌ Reuse permissions across values without intent

## Permission Verification

### Checking If Permission Exists

```solidity
// There's no direct check in current FHEVM
// Permissions are implicitly checked during decryption
// If permission missing, decryption fails

// Best practice: Document which values need which permissions
mapping(address => bool) private hasDecryptPermission;
```

### Testing Permissions

```typescript
describe("Permissions", function () {
  it("should allow contract to read", async function () {
    const input = await account.createEncryptedInput(
      await contract.getAddress(),
      account.address
    );
    input.add32(42);
    const { handles, inputProof } = await input.encrypt();

    // Store with permission
    await contract.store(handles[0], inputProof);

    // Contract should be able to compute
    const result = await contract.computeOnValue();
    expect(result).to.not.be.undefined;
  });

  it("should allow user to decrypt", async function () {
    // After contract grants permission,
    // User should be able to decrypt via relayer
    const encrypted = await contract.getValue();
    const decrypted = await relayer.decrypt(encrypted);
    expect(decrypted).to.equal(42);
  });
});
```

## Permission Mistakes and Fixes

### Mistake 1: Only Contract Permission

```solidity
// ❌ WRONG
function store(externalEuint32 secret, bytes calldata proof) external {
    euint32 value = FHE.fromExternal(secret, proof);
    secrets[msg.sender] = value;
    FHE.allowThis(secrets[msg.sender]);
    // Missing: FHE.allow(secrets[msg.sender], msg.sender);
}

// ✅ FIXED
function store(externalEuint32 secret, bytes calldata proof) external {
    euint32 value = FHE.fromExternal(secret, proof);
    secrets[msg.sender] = value;
    FHE.allowThis(secrets[msg.sender]);
    FHE.allow(secrets[msg.sender], msg.sender);  // Add this!
}
```

### Mistake 2: Only User Permission

```solidity
// ❌ WRONG
function store(externalEuint32 secret, bytes calldata proof) external {
    euint32 value = FHE.fromExternal(secret, proof);
    secrets[msg.sender] = value;
    FHE.allow(secrets[msg.sender], msg.sender);
    // Missing: FHE.allowThis(secrets[msg.sender]);
}

// ✅ FIXED
function store(externalEuint32 secret, bytes calldata proof) external {
    euint32 value = FHE.fromExternal(secret, proof);
    secrets[msg.sender] = value;
    FHE.allowThis(secrets[msg.sender]);         // Add this!
    FHE.allow(secrets[msg.sender], msg.sender);
}
```

### Mistake 3: Forgetting Permissions on New Values

```solidity
// ❌ WRONG
function update(externalEuint32 newValue, bytes calldata proof) external {
    euint32 value = FHE.fromExternal(newValue, proof);
    euint32 result = FHE.add(value, stored[msg.sender]);
    stored[msg.sender] = result;
    // Forgot permissions on result!
}

// ✅ FIXED
function update(externalEuint32 newValue, bytes calldata proof) external {
    euint32 value = FHE.fromExternal(newValue, proof);
    euint32 result = FHE.add(value, stored[msg.sender]);
    stored[msg.sender] = result;
    FHE.allowThis(stored[msg.sender]);        // Grant on new value
    FHE.allow(stored[msg.sender], msg.sender);
}
```

## Permission Examples from Repository

See these contracts for permission patterns:

- **SimpleMembership.sol** - Basic permission grant
- **EncryptMultipleValues.sol** - Permissions for multiple fields
- **UserDecryptSingleValue.sol** - User-focused permissions
- **PublicDecryptSingleValue.sol** - Public vs private permissions

## Summary

**The Core Rule:**
Always grant BOTH:
1. `FHE.allowThis(value)` - Contract permission
2. `FHE.allow(value, user)` - User permission

**Remember:**
✅ Both permissions needed for full functionality
✅ Missing either causes failures
✅ Grant immediately after storing
✅ Necessary for each new encrypted value
✅ Critical for security and functionality

---

## See Also

- [Input Proofs Guide](./input-proofs.md) - How values enter contract
- [Handles Guide](./handles.md) - What permissions protect
- [SimpleMembership Example](../examples/basic-member.md) - Pattern in action

