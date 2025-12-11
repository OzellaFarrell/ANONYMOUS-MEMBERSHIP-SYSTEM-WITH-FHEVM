# Troubleshooting Guide

Common issues and their solutions for FHEVM development.

## Compilation Issues

### Error: "Cannot find module '@fhevm/solidity'"

**Symptom:**
```
Error: Cannot find module '@fhevm/solidity'
```

**Cause:** FHEVM dependencies not installed

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Or specifically install FHEVM
npm install @fhevm/solidity@latest
npm install @fhevm/hardhat-plugin@latest
```

**Verify:**
```bash
npm list @fhevm/solidity
npm list @fhevm/hardhat-plugin
```

### Error: "Solidity version mismatch"

**Symptom:**
```
Error: Solidity 0.8.20 does not satisfy the ^0.8.24 requirement
```

**Cause:** Wrong Solidity compiler version

**Solution:**

Update `hardhat.config.ts`:
```typescript
solidity: {
  version: "0.8.24",  // ✅ Must be 0.8.24 or higher
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
}
```

**Clean and recompile:**
```bash
npm run clean
npm run compile
```

### Error: "Stack too deep"

**Symptom:**
```
CompilerError: Stack too deep when compiling inline assembly
```

**Cause:** Too many local variables

**Solutions:**

1. **Enable optimizer** (in hardhat.config.ts):
   ```typescript
   optimizer: {
     enabled: true,  // ✅ Enable this
     runs: 200,
   }
   ```

2. **Reduce local variables:**
   ```solidity
   // ❌ Too many variables
   function example() external {
     euint32 var1 = ...;
     euint32 var2 = ...;
     euint32 var3 = ...;
     // ... 10 more variables
   }

   // ✅ Combine operations
   function example() external {
     euint32 result = FHE.add(
       FHE.mul(a, b),
       FHE.sub(c, d)
     );
   }
   ```

## Test Issues

### Error: "Proof validation failed"

**Symptom:**
```
Error: Proof validation failed
```

**Causes and Solutions:**

#### 1. Wrong Contract Address

```typescript
// ❌ WRONG
const input = await account.createEncryptedInput(
  wrongContractAddress,  // Wrong address!
  account.address
);

// ✅ CORRECT
const contractAddress = await contract.getAddress();
const input = await account.createEncryptedInput(
  contractAddress,  // ✅ Correct address
  account.address
);
```

#### 2. Signer Mismatch

```typescript
// ❌ WRONG
const input = await alice.createEncryptedInput(
  contractAddress,
  alice.address
);
await contract.connect(bob).setValue(...);  // Bob != Alice!

// ✅ CORRECT
const input = await alice.createEncryptedInput(
  contractAddress,
  alice.address
);
await contract.connect(alice).setValue(...);  // Alice == Alice ✅
```

#### 3. Missing or Wrong Proof

```solidity
// ❌ WRONG - No proof parameter
function setValue(externalEuint32 value) external {
  euint32 val = FHE.fromExternal(value, ???);  // Missing proof!
}

// ✅ CORRECT - Include proof
function setValue(externalEuint32 value, bytes calldata proof) external {
  euint32 val = FHE.fromExternal(value, proof);
}
```

### Error: "Cannot decrypt value"

**Symptom:**
```
Error: User does not have permission to decrypt
```

**Cause:** Missing FHE.allow permission

**Solution:**

```solidity
function storeValue(externalEuint32 encrypted, bytes calldata proof) external {
  euint32 value = FHE.fromExternal(encrypted, proof);
  stored[msg.sender] = value;

  // ✅ CRITICAL: Grant both permissions!
  FHE.allowThis(stored[msg.sender]);           // Contract permission
  FHE.allow(stored[msg.sender], msg.sender);   // User permission ← ADD THIS
}
```

**Verify both permissions are granted:**
- `FHE.allowThis()` - For contract operations
- `FHE.allow()` - For user decryption

### Error: "Test timeout"

**Symptom:**
```
Error: Timeout of 20000ms exceeded
```

**Causes:**

1. **Long compilation** - First run compiles FHE library
2. **Complex operations** - FHE operations are computationally intensive
3. **Network issues** - Waiting for transactions

**Solutions:**

1. **Increase timeout:**
   ```typescript
   describe("MyContract", function () {
     this.timeout(60000);  // 60 seconds

     it("should work", async function () {
       // test code
     });
   });
   ```

2. **Wait for transactions:**
   ```typescript
   const tx = await contract.setValue(...);
   await tx.wait();  // ✅ Wait for confirmation
   ```

3. **Optimize tests:**
   ```typescript
   // ❌ Multiple deployments
   beforeEach(async function () {
     contract = await deploy();  // Slow!
   });

   // ✅ Single deployment
   before(async function () {
     contract = await deploy();  // Faster!
   });
   ```

### Error: "Gas estimation failed"

**Symptom:**
```
Error: cannot estimate gas; transaction may fail
```

**Causes:**

1. Transaction would revert
2. Missing permissions
3. Arithmetic underflow/overflow
4. Out of gas

**Debugging:**

```bash
# Run with verbose logging
npm run test:debug

# Check specific test
npm run test test/MyContract.ts
```

**Common fixes:**

```solidity
// ❌ Underflow
euint32 balance = FHE.asEuint32(5);
euint32 amount = FHE.asEuint32(10);
euint32 result = FHE.sub(balance, amount);  // 5 - 10 = underflow!

// ✅ Check first
bool hasSufficient = FHE.gte(balance, amount);
// Handle insufficient balance case

// ❌ Missing permission
euint32 value = stored[user];
euint32 result = FHE.add(value, amount);  // Fails if no FHE.allowThis!

// ✅ Ensure permissions
FHE.allowThis(stored[user]);
euint32 result = FHE.add(stored[user], amount);
```

## Type Errors

### Error: "Type mismatch"

**Symptom:**
```
TypeError: Cannot perform operation on euint32 and euint8
```

**Cause:** Mixing different encrypted types

**Solution:**

```solidity
// ❌ WRONG - Type mismatch
euint32 value32 = ...;
euint8 value8 = ...;
euint32 result = FHE.add(value32, value8);  // Error!

// ✅ CORRECT - Cast first
euint32 value8as32 = FHE.cast(value8, euint32);
euint32 result = FHE.add(value32, value8as32);

// ✅ OR - Cast both to common type
euint64 val32as64 = FHE.cast(value32, euint64);
euint64 val8as64 = FHE.cast(value8, euint64);
euint64 result = FHE.add(val32as64, val8as64);
```

### Error: "Cannot assign externalEuint32 to euint32"

**Symptom:**
```
TypeError: Cannot assign externalEuint32 to euint32
```

**Cause:** Not converting external to internal type

**Solution:**

```solidity
// ❌ WRONG
euint32 value;

function setValue(externalEuint32 encrypted) external {
  value = encrypted;  // Can't assign directly!
}

// ✅ CORRECT - Convert with FHE.fromExternal
function setValue(externalEuint32 encrypted, bytes calldata proof) external {
  value = FHE.fromExternal(encrypted, proof);  // ✅ Convert first
}
```

## Permission Issues

### Issue: Contract can't read encrypted value

**Symptom:**
Operations on encrypted value fail in contract

**Cause:** Missing `FHE.allowThis`

**Solution:**

```solidity
function store(externalEuint32 encrypted, bytes calldata proof) external {
  euint32 value = FHE.fromExternal(encrypted, proof);
  data[msg.sender] = value;

  FHE.allowThis(data[msg.sender]);  // ✅ ADD THIS for contract access
  FHE.allow(data[msg.sender], msg.sender);
}
```

### Issue: User can't decrypt their value

**Symptom:**
Relayer decryption fails for user

**Cause:** Missing `FHE.allow`

**Solution:**

```solidity
function store(externalEuint32 encrypted, bytes calldata proof) external {
  euint32 value = FHE.fromExternal(encrypted, proof);
  data[msg.sender] = value;

  FHE.allowThis(data[msg.sender]);
  FHE.allow(data[msg.sender], msg.sender);  // ✅ ADD THIS for user decryption
}
```

### Issue: Permissions not working after update

**Symptom:**
After updating encrypted value, permissions are lost

**Cause:** Forgot to re-grant permissions on new value

**Solution:**

```solidity
function update(externalEuint32 newValue, bytes calldata proof) external {
  euint32 value = FHE.fromExternal(newValue, proof);

  // Update value
  data[msg.sender] = FHE.add(data[msg.sender], value);

  // ✅ CRITICAL: Re-grant permissions on new value
  FHE.allowThis(data[msg.sender]);
  FHE.allow(data[msg.sender], msg.sender);
}
```

## Runtime Issues

### Error: "Transaction reverted without reason"

**Symptom:**
```
Error: Transaction reverted without a reason string
```

**Debugging steps:**

1. **Add require messages:**
   ```solidity
   // ❌ No message
   require(condition);

   // ✅ With message
   require(condition, "MyContract: condition failed");
   ```

2. **Check permissions:**
   ```solidity
   // Ensure both permissions granted
   FHE.allowThis(value);
   FHE.allow(value, user);
   ```

3. **Add events for debugging:**
   ```solidity
   event Debug(string message);

   function myFunction() external {
     emit Debug("Reached checkpoint 1");
     // ... code ...
     emit Debug("Reached checkpoint 2");
   }
   ```

4. **Run in debug mode:**
   ```bash
   npm run test:debug
   ```

### Error: "Nonce too high"

**Symptom:**
```
Error: Nonce too high. Expected nonce to be X but got Y
```

**Cause:** Account nonce out of sync

**Solution:**

```bash
# Reset Hardhat network
npm run clean
npx hardhat node  # Restart node

# Or in tests
await network.provider.send("hardhat_reset");
```

### Error: "Insufficient funds"

**Symptom:**
```
Error: sender doesn't have enough funds
```

**Solutions:**

1. **In tests:**
   ```typescript
   const [deployer, ...accounts] = await ethers.getSigners();
   // deployer has funds by default
   ```

2. **On testnet:**
   - Get testnet ETH from faucet
   - https://sepoliafaucet.com
   - Check balance: `npx hardhat accounts`

3. **Check gas price:**
   ```typescript
   const tx = await contract.setValue(..., {
     gasLimit: 500000,  // Adjust if needed
   });
   ```

## Development Issues

### Issue: Changes not reflected

**Symptom:**
Code changes don't appear after recompile

**Solution:**

```bash
# Clean everything
npm run clean
rm -rf artifacts cache typechain-types

# Recompile
npm run compile

# Restart if using node
npm run node
```

### Issue: TypeChain types not found

**Symptom:**
```
Cannot find module './typechain-types'
```

**Solution:**

```bash
# Generate types
npm run compile  # Triggers TypeChain

# Or explicitly
npx hardhat typechain

# Verify
ls typechain-types/  # Should see generated files
```

### Issue: Import paths not working

**Symptom:**
```
Error: Source "@fhevm/solidity/lib/FHE.sol" not found
```

**Solutions:**

1. **Check node_modules:**
   ```bash
   ls node_modules/@fhevm/solidity
   ```

2. **Reinstall:**
   ```bash
   npm install @fhevm/solidity@latest
   ```

3. **Verify import path:**
   ```solidity
   // ✅ Correct
   import { FHE, euint32 } from "@fhevm/solidity/lib/FHE.sol";

   // ❌ Wrong
   import { FHE } from "@fhevm/FHE.sol";
   ```

## Automation Script Issues

### Error: "Example not found"

**Symptom:**
```
Error: Example "my-example" not found
```

**Solution:**

```bash
# List available examples
npm run create-example --list

# Use exact name
npm run create-example basic-member ./output
```

### Error: "Cannot create directory"

**Symptom:**
```
Error: EEXIST: file already exists
```

**Solutions:**

1. **Use different output path:**
   ```bash
   npm run create-example basic-member ./output2
   ```

2. **Remove existing:**
   ```bash
   rm -rf ./output
   npm run create-example basic-member ./output
   ```

3. **Use absolute path:**
   ```bash
   npm run create-example basic-member /absolute/path/output
   ```

## Performance Issues

### Issue: Tests run very slowly

**Causes:**

1. **First run** - Compiling FHE library (normal)
2. **Too many re-deployments** - Deploy once in `before()`
3. **Complex FHE operations** - Inherently slow

**Optimizations:**

```typescript
// ❌ Slow - Deploy every test
beforeEach(async function () {
  contract = await deploy();
});

// ✅ Fast - Deploy once
before(async function () {
  contract = await deploy();
});

// ❌ Slow - Multiple createEncryptedInput calls
const input1 = await account.createEncryptedInput(...);
const input2 = await account.createEncryptedInput(...);

// ✅ Fast - Batch inputs
const input = await account.createEncryptedInput(...);
input.add32(value1);
input.add32(value2);
const { handles, inputProof } = await input.encrypt();
```

### Issue: High gas costs

**FHE operations are expensive!**

**Optimizations:**

1. **Batch operations:**
   ```solidity
   // ❌ Multiple operations
   euint32 temp1 = FHE.add(a, b);
   euint32 temp2 = FHE.add(c, d);
   euint32 result = FHE.add(temp1, temp2);

   // ✅ Chain operations
   euint32 result = FHE.add(
     FHE.add(a, b),
     FHE.add(c, d)
   );
   ```

2. **Reuse values:**
   ```solidity
   // ❌ Recalculate
   function getBalance() public view returns (euint32) {
     return FHE.add(balance, pending);
   }

   // ✅ Store result
   euint32 totalBalance;
   function updateBalance() internal {
     totalBalance = FHE.add(balance, pending);
   }
   ```

## Still Stuck?

### Debug Checklist

- [ ] Cleaned and recompiled: `npm run clean && npm run compile`
- [ ] Verified dependencies: `npm list @fhevm/solidity`
- [ ] Checked both FHE permissions granted
- [ ] Ensured correct types (euint32, not externalEuint32)
- [ ] Verified proof provided with externalEuint32
- [ ] Matching contract address in encryption
- [ ] Matching user address (msg.sender)
- [ ] Read error messages carefully
- [ ] Checked example contracts for patterns

### Get Help

1. **Check documentation:**
   - README.md
   - QUICK_START.md
   - FAQ.md
   - Example contracts

2. **Search examples:**
   - Look at working examples
   - Compare your code to examples

3. **Ask community:**
   - Discord: https://discord.com/invite/zama
   - Forum: https://www.zama.ai/community

4. **Report bugs:**
   - GitHub Issues
   - Include error messages
   - Provide minimal reproduction

---

**Found a solution not listed here?** Please contribute back!
