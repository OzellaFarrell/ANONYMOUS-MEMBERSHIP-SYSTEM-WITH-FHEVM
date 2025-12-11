# Frequently Asked Questions (FAQ)

## General Questions

### What is FHEVM?

FHEVM (Fully Homomorphic Encryption Virtual Machine) is a blockchain virtual machine that allows smart contracts to perform computations on encrypted data without ever decrypting it. This enables true privacy for blockchain applications.

### What is this project about?

The Anonymous Membership System demonstrates how to build privacy-preserving membership platforms using FHEVM. It includes:
- 9+ working contract examples
- Comprehensive test suites
- Automation tools for generating projects
- Complete documentation

### Is this production-ready?

This is an educational and demonstration project for the Zama FHEVM Bounty competition. While the patterns are correct and secure, you should:
- Add production-grade error handling
- Implement comprehensive access controls
- Add overflow/underflow checks
- Conduct security audits
- Test extensively on testnets

### What's the difference between this and regular smart contracts?

**Regular Smart Contracts:**
- All data is public on blockchain
- Anyone can see balances, values, operations
- Privacy only through off-chain solutions

**FHEVM Smart Contracts:**
- Data is encrypted on-chain
- Computations happen on encrypted data
- Only authorized parties can decrypt
- Privacy is native and cryptographic

## Setup and Installation

### What do I need to get started?

**Prerequisites:**
- Node.js >= 20
- npm or yarn
- Git
- Basic understanding of Solidity
- Familiarity with Hardhat

**Installation:**
```bash
npm install
npm run compile
npm run test
```

### Why does compilation take so long?

FHEVM contracts include cryptographic libraries that need compilation. First-time compilation includes:
- FHEVM Solidity library
- Hardhat plugins
- TypeChain type generation

Subsequent compilations are faster due to caching.

### Can I use this with my existing Hardhat project?

Yes! Key steps:
1. Install FHEVM dependencies
2. Add `@fhevm/hardhat-plugin` to your config
3. Update Solidity version to ^0.8.24
4. Import FHE library in contracts

See `hardhat.config.ts` for configuration example.

## FHE and Encryption

### What can be encrypted?

FHEVM supports encrypted integer types:
- `euint8` - 8-bit unsigned integer
- `euint16` - 16-bit unsigned integer
- `euint32` - 32-bit unsigned integer
- `euint64` - 64-bit unsigned integer
- `euint128` - 128-bit unsigned integer
- `euint256` - 256-bit unsigned integer (when supported)

### Can I encrypt strings or addresses?

Currently, FHEVM focuses on encrypted integers. For strings or addresses:
- Hash them to integers
- Store hash as encrypted value
- Or store unencrypted with encrypted metadata

### What operations are supported on encrypted data?

**Arithmetic:**
- `FHE.add()` - Addition
- `FHE.sub()` - Subtraction
- `FHE.mul()` - Multiplication
- `FHE.div()` - Division (limited)

**Comparison:**
- `FHE.eq()` - Equality
- `FHE.ne()` - Not equal
- `FHE.lt()` - Less than
- `FHE.lte()` - Less than or equal
- `FHE.gt()` - Greater than
- `FHE.gte()` - Greater than or equal

**Bitwise:**
- `FHE.and()` - Bitwise AND
- `FHE.or()` - Bitwise OR
- `FHE.xor()` - Bitwise XOR

**Other:**
- `FHE.select()` - Conditional selection
- `FHE.cast()` - Type conversion

### How does encryption binding work?

Encrypted values are bound to `[contract, user]` pairs:

```
Encrypted Value = Encrypt(plaintext, CONTRACT_ADDRESS, USER_ADDRESS)
```

This means:
- Value can only be decrypted by that contract + user combination
- Prevents replay attacks across contracts
- Ensures values belong to right users
- Verified with zero-knowledge proofs

## Permissions

### Why do I need FHE.allowThis AND FHE.allow?

**Two permissions required:**

1. **FHE.allowThis(value)** - Contract permission
   - Allows contract to read encrypted value
   - Needed for contract operations
   - Without it: contract can't use the value

2. **FHE.allow(value, user)** - User permission
   - Allows user to decrypt their value
   - Needed for user to get plaintext
   - Without it: user can't decrypt

**Both are critical!** Missing either breaks functionality.

### Can I revoke permissions?

Currently, FHE permissions are persistent once granted. In production systems, you might:
- Create new encrypted values instead of revoking
- Implement time-based access at application layer
- Use `FHE.allowTransient()` for temporary access

### What happens if I forget permissions?

**Forgot FHE.allowThis:**
- Contract cannot read the value
- Operations on value will fail
- Contract logic breaks

**Forgot FHE.allow:**
- User cannot decrypt their value
- User can't retrieve plaintext
- Data is "locked"

**Fix:** You can grant permissions later if you still have access to the encrypted value.

## Testing

### How do I test encrypted values?

```typescript
describe("EncryptedValue", function () {
  it("should work with encrypted value", async function () {
    // Create encrypted input
    const input = await account.createEncryptedInput(
      contractAddress,
      account.address
    );
    input.add32(42);  // Plaintext goes in
    const { handles, inputProof } = await input.encrypt();

    // Send to contract
    await contract.setValue(handles[0], inputProof);

    // Get encrypted result back
    const encrypted = await contract.getValue();

    // Verify (encrypted value exists)
    expect(encrypted).to.not.be.undefined;

    // To see plaintext (in tests):
    const decrypted = await decrypt(encrypted);
    expect(decrypted).to.equal(42);
  });
});
```

### Can I see the plaintext in tests?

Yes, test environment allows decryption:

```typescript
const decrypted = await decrypt(encryptedValue);
```

On mainnet, only via relayer with proper permissions.

### Why do my tests fail with "proof validation failed"?

Common causes:

1. **Wrong contract address:**
   ```typescript
   // ❌ Wrong
   const input = await account.createEncryptedInput(
     wrongAddress,  // Oops!
     account.address
   );
   ```

2. **Wrong user:**
   ```typescript
   // ❌ Wrong
   const input = await alice.createEncryptedInput(
     contractAddress,
     alice.address
   );
   await contract.connect(bob).setValue(...);  // Mismatch!
   ```

3. **Missing input proof:**
   ```solidity
   // ❌ Wrong
   function setValue(externalEuint32 value) external {
     // Missing proof parameter!
   }
   ```

## Development

### How do I add a new encrypted field?

1. **Define in contract:**
   ```solidity
   euint32 private newField;
   ```

2. **Create setter:**
   ```solidity
   function setNewField(externalEuint32 value, bytes calldata proof) external {
     euint32 val = FHE.fromExternal(value, proof);
     newField = val;
     FHE.allowThis(newField);
     FHE.allow(newField, msg.sender);
   }
   ```

3. **Create getter:**
   ```solidity
   function getNewField() external view returns (euint32) {
     return newField;
   }
   ```

4. **Test it:**
   ```typescript
   const input = await account.createEncryptedInput(addr, account.address);
   input.add32(123);
   const { handles, inputProof } = await input.encrypt();
   await contract.setNewField(handles[0], inputProof);
   ```

### How do I perform arithmetic on encrypted values?

```solidity
euint32 balance = balances[user];
euint32 amount = FHE.fromExternal(encryptedAmount, proof);

// Add
euint32 newBalance = FHE.add(balance, amount);

// Subtract
euint32 afterDeduction = FHE.sub(balance, amount);

// Multiply
euint32 doubled = FHE.mul(balance, FHE.asEuint32(2));

// Remember to grant permissions on new values!
FHE.allowThis(newBalance);
FHE.allow(newBalance, user);
```

### Can I use encrypted values in conditionals?

Not directly, but you can use encrypted comparisons:

```solidity
// ❌ Won't work
if (encryptedBalance > 100) {
  // Can't directly compare encrypted
}

// ✅ Works
bool isGreater = FHE.gt(encryptedBalance, FHE.asEuint32(100));
// isGreater is encrypted boolean

// Use FHE.select for conditional logic
euint32 result = FHE.select(
  isGreater,
  option1,  // If true
  option2   // If false
);
```

## Automation Tools

### How do I generate a standalone example?

```bash
npm run create-example basic-member ./output/basic-member
cd output/basic-member
npm install
npm run test
```

### What examples are available?

Run:
```bash
npm run create-example --list
```

Current examples:
- basic-member
- fhe-arithmetic
- equality-comparison
- encrypt-single-value
- encrypt-multiple-values
- user-decrypt-single
- public-decrypt-single
- role-based-access
- common-pitfalls

### How do I generate documentation?

```bash
# Single example
npm run generate-docs basic-member

# All examples
npm run generate-docs --all

# List available
npm run generate-docs --list
```

Documentation generated in `docs/` directory.

### Can I create my own categories?

Yes! Edit `scripts/create-membership-category.ts`:

```typescript
const CATEGORIES_MAP = {
  "my-category": {
    name: "My Custom Category",
    description: "My examples",
    examples: ["example1", "example2"]
  }
};
```

Then:
```bash
npm run create-category my-category ./output
```

## Errors and Troubleshooting

### "Cannot find module '@fhevm/solidity'"

**Solution:**
```bash
npm install
npm install @fhevm/solidity@latest
```

### "Proof validation failed"

**Causes:**
1. Wrong contract address in encryption
2. msg.sender doesn't match encryption signer
3. Proof was tampered with
4. Using wrong proof

**Fix:** Ensure encryption matches:
```typescript
const input = await account.createEncryptedInput(
  correctContractAddress,  // ✅ Must match
  account.address           // ✅ Must match msg.sender
);
```

### "Function is not defined"

**Common mistakes:**
- Not importing FHE library
- Wrong function name
- Missing FHEVM plugin

**Fix:**
```solidity
import { FHE, euint32 } from "@fhevm/solidity/lib/FHE.sol";
```

### "Gas estimation failed"

**Causes:**
- Transaction would revert
- Missing permissions
- Underflow/overflow
- Out of gas

**Debug:**
```bash
npm run test:debug
```

Check revert reasons in error messages.

### "Type mismatch"

**Cause:** Mixing encrypted types

```solidity
// ❌ Wrong
euint32 val32 = ...;
euint8 val8 = ...;
euint32 result = FHE.add(val32, val8);  // Error!

// ✅ Fixed
euint32 val8as32 = FHE.cast(val8, euint32);
euint32 result = FHE.add(val32, val8as32);
```

## Competition

### Is this ready for submission?

Yes! The project includes:
- ✅ All required deliverables
- ✅ Working examples
- ✅ Automation scripts
- ✅ Comprehensive documentation
- ✅ Test suites

Follow `SUBMISSION_GUIDE.md` for submission steps.

### What's needed for the video?

**Show:**
1. Project compilation
2. Running tests
3. Generating standalone example
4. Documentation generation
5. Key features demonstration

**Duration:** 5-15 minutes

**See:** SUBMISSION_GUIDE.md for detailed requirements

### Where do I submit?

Submit through Zama Developer Program on Guild:
https://guild.xyz/zama/developer-program

### When is the deadline?

December 31, 2025 (23:59 Anywhere on Earth)

## Additional Resources

### Where can I learn more?

**FHEVM:**
- https://docs.zama.ai/fhevm
- https://github.com/zama-ai/fhevm

**Hardhat:**
- https://hardhat.org/docs

**Solidity:**
- https://docs.soliditylang.org

**Community:**
- Discord: https://discord.com/invite/zama
- Forum: https://www.zama.ai/community

### Where can I get help?

1. **Check documentation:**
   - README.md
   - QUICK_START.md
   - docs/getting-started.md

2. **Search examples:**
   - contracts/ directory
   - test/ directory

3. **Ask community:**
   - Zama Discord
   - Community Forum

4. **Report issues:**
   - GitHub Issues
   - Competition forum

## Still Have Questions?

**Check:**
- [Getting Started Guide](./getting-started.md)
- [Troubleshooting Guide](./troubleshooting.md)
- [Input Proofs Guide](./guides/input-proofs.md)
- [Handles Guide](./guides/handles.md)
- [Permissions Guide](./guides/permissions.md)

**Ask:**
- Zama Discord: https://discord.com/invite/zama
- Forum: https://www.zama.ai/community

---

**Found an error in this FAQ?** Submit an issue or pull request!
