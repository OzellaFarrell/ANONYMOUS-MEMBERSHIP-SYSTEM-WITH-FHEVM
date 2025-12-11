# Getting Started with FHEVM

Welcome to the Anonymous Membership System FHEVM development guide!

## What is FHEVM?

FHEVM (Fully Homomorphic Encryption Virtual Machine) is a groundbreaking technology that allows smart contracts to perform computations on encrypted data without ever decrypting it. This means:

- **Privacy**: Data remains encrypted throughout computation
- **Transparency**: Results can be verified without revealing inputs
- **Programmability**: Complex logic on encrypted values
- **Security**: Cryptographic guarantees, not trust-based

## Key Concepts

### 1. Encrypted Data Types

FHEVM provides encrypted integer types:

- `euint8` - 8-bit encrypted unsigned integer
- `euint32` - 32-bit encrypted unsigned integer
- `euint64` - 64-bit encrypted unsigned integer
- `euint128` - 128-bit encrypted unsigned integer

### 2. Encryption Binding

Values are encrypted to a `[contract, user]` pair:

```
EncryptedValue = Encrypt(plaintext, contractAddress, userAddress)
```

This binding ensures:
- Only that contract and user combination can decrypt
- Proof validates correct binding
- Prevents misuse of encrypted data

### 3. FHE Operations

Supported operations on encrypted data:

- **Arithmetic**: add, sub, mul
- **Comparison**: eq, lt, lte, gt, gte
- **Bitwise**: and, or, xor
- **Logical**: not

Example:

```solidity
euint32 result = FHE.add(encryptedA, encryptedB);
bool isEqual = FHE.eq(encryptedValue, targetValue);
```

### 4. Permission Management

Two types of permissions needed:

**Contract Permission (FHE.allowThis)**:
```solidity
FHE.allowThis(encryptedValue);
```
Allows the contract to decrypt and use the value.

**User Permission (FHE.allow)**:
```solidity
FHE.allow(encryptedValue, msg.sender);
```
Allows the user to decrypt their value through relayer.

**CRITICAL**: Both permissions are required!

## Installation & Setup

### 1. Prerequisites

```bash
# Check Node.js version (>= 20)
node --version

# Check npm
npm --version
```

### 2. Clone and Install

```bash
cd AnonymousMembership
npm install
```

### 3. Environment Variables

```bash
cp .env.example .env
# Edit .env with your configuration
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
```

### 4. Compile

```bash
npm run compile
```

## Your First Contract

### Create a Simple Storage Contract

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract SecretStorage is ZamaEthereumConfig {
    mapping(address => euint32) private secrets;

    function storeSecret(externalEuint32 encryptedSecret, bytes calldata proof) external {
        euint32 secret = FHE.fromExternal(encryptedSecret, proof);
        secrets[msg.sender] = secret;

        // ALWAYS grant both permissions!
        FHE.allowThis(secrets[msg.sender]);
        FHE.allow(secrets[msg.sender], msg.sender);
    }

    function getSecret() external view returns (euint32) {
        return secrets[msg.sender];
    }
}
```

### Create a Test

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { getSigners, initializeAccount } from "@fhevm/hardhat-plugin";

describe("SecretStorage", function () {
  let contract: any;

  beforeEach(async function () {
    const accounts = await getSigners();
    const Factory = await ethers.getContractFactory("SecretStorage");
    contract = await Factory.deploy();
    await initializeAccount();
  });

  it("should store encrypted secret", async function () {
    const account = accounts[0];

    // Create encrypted input
    const encryptedInput = await account.createEncryptedInput(
      await contract.getAddress(),
      account.address
    );
    encryptedInput.add32(42); // Secret value
    const encrypted = await encryptedInput.encrypt();

    // Store secret
    await contract.storeSecret(encrypted.handles[0], encrypted.inputProof);

    // Retrieve (still encrypted)
    const result = await contract.getSecret();
    expect(result).to.not.be.undefined;
  });
});
```

### Run Test

```bash
npm run test
```

## Common Patterns

### Pattern 1: Encrypted Storage

```solidity
mapping(address => euint32) private data;

function setData(externalEuint32 encrypted, bytes calldata proof) external {
    euint32 value = FHE.fromExternal(encrypted, proof);
    data[msg.sender] = value;
    FHE.allowThis(data[msg.sender]);
    FHE.allow(data[msg.sender], msg.sender);
}
```

### Pattern 2: Encrypted Comparison

```solidity
function checkPassword(externalEuint32 guess, bytes calldata proof) external {
    euint32 value = FHE.fromExternal(guess, proof);
    bool isCorrect = FHE.eq(value, passwordHash);
    return isCorrect;
}
```

### Pattern 3: Encrypted Arithmetic

```solidity
euint32 balance;

function addToBalance(externalEuint32 amount, bytes calldata proof) external {
    euint32 value = FHE.fromExternal(amount, proof);
    balance = FHE.add(balance, value);
    FHE.allowThis(balance);
}
```

## Important Rules

### ✅ DO:

- ✅ Always call `FHE.allowThis()` for contract access
- ✅ Always call `FHE.allow()` for user access
- ✅ Validate input proofs with `FHE.fromExternal()`
- ✅ Use encrypted types consistently
- ✅ Test thoroughly with the test framework

### ❌ DON'T:

- ❌ Forget FHE permissions (most common error!)
- ❌ Return encrypted values from view functions
- ❌ Mix encrypted types without proper casting
- ❌ Trust unvalidated external data
- ❌ Expose encrypted values in events

## Testing

### Run All Tests

```bash
npm run test
```

### Run Specific Test File

```bash
npm run test test/MyContract.ts
```

### Debug Mode

```bash
npm run test:debug
```

### Coverage

```bash
npm run coverage
```

## Troubleshooting

### "Cannot decrypt value"

**Cause**: Missing FHE.allow permission

**Solution**: Ensure both permissions are granted:
```solidity
FHE.allowThis(value);
FHE.allow(value, msg.sender);
```

### "Input proof validation failed"

**Cause**: Encryption/proof mismatch

**Solution**: Ensure encryption is done for the correct contract and user:
```typescript
const encrypted = await account.createEncryptedInput(
  contractAddress,
  account.address  // Must match sender
);
```

### "Type mismatch"

**Cause**: Mixing different encrypted types

**Solution**: Ensure type consistency or cast explicitly:
```solidity
euint32 value32 = FHE.cast(value8, euint32);
```

## Next Steps

1. **Explore Examples**: Check `contracts/` for working examples
2. **Review Tests**: See `test/` for testing patterns
3. **Try Modifications**: Modify examples and test your changes
4. **Build Your Own**: Create new contracts using the patterns
5. **Contribute**: Share your examples and improvements

## Resources

- **FHEVM Docs**: https://docs.zama.ai/fhevm
- **Hardhat Guide**: https://hardhat.org/hardhat-runner/docs/getting-started
- **Solidity Docs**: https://docs.soliditylang.org
- **ethers.js v6**: https://docs.ethers.org/v6/

## Support

- **Discord**: https://discord.com/invite/zama
- **Forum**: https://www.zama.ai/community
- **GitHub Issues**: Report bugs and request features

---

Ready to build? Start with the basic examples and work your way up! 🚀
