# FHEVM Base Template

A complete Hardhat-based template for developing Fully Homomorphic Encryption (FHE) enabled smart contracts using FHEVM by Zama.

## Overview

This template provides:

- **FHEVM Integration**: Pre-configured Hardhat plugin for FHE testing
- **Modern Setup**: TypeScript, Hardhat, ethers.js v6
- **Development Tools**: Linting, coverage, gas reporting
- **Deployment Scripts**: Hardhat-deploy integration
- **Type Safety**: TypeChain for contract type generation

## Prerequisites

- Node.js >= 20
- npm or yarn

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
```

### 3. Compile Contracts

```bash
npm run compile
```

### 4. Run Tests

```bash
npm run test
```

### 5. Deploy

```bash
npx hardhat deploy --network localhost
```

## Project Structure

```
base-template/
├── contracts/              # Smart contract source files
│   └── Example.sol
├── test/                   # Test files
│   └── Example.ts
├── deploy/                 # Deployment scripts
│   └── 01-deploy.ts
├── hardhat.config.ts       # Hardhat configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies
└── .env.example            # Environment template
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run compile` | Compile all contracts |
| `npm run test` | Run all tests |
| `npm run test:debug` | Run tests with verbose output |
| `npm run coverage` | Generate coverage report |
| `npm run lint` | Run solhint linting |
| `npm run clean` | Clean build artifacts |
| `npm run node` | Start local FHEVM node |
| `npm run deploy` | Deploy contracts |

## Environment Variables

Create `.env` file based on `.env.example`:

```bash
# Network RPC URL
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

# Account management
MNEMONIC=your twelve word seed phrase

# API Keys
ETHERSCAN_API_KEY=your_etherscan_key
INFURA_API_KEY=your_infura_key

# Optional: Gas reporting
REPORT_GAS=false
COINMARKETCAP_API_KEY=your_coinmarketcap_key
```

## Developing Contracts

### 1. Create Contract

Add your contract to `contracts/`:

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract MyContract is ZamaEthereumConfig {
    // Your code here
}
```

### 2. Create Tests

Add tests to `test/`:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { getSigners, initializeAccount } from "@fhevm/hardhat-plugin";

describe("MyContract", function () {
  let contract: any;

  beforeEach(async function () {
    const signers = await getSigners();
    const Factory = await ethers.getContractFactory("MyContract");
    contract = await Factory.deploy();
    await initializeAccount();
  });

  it("should work", async function () {
    // Your test here
  });
});
```

### 3. Test

```bash
npm run test
```

### 4. Deploy

Add deployment script to `deploy/`:

```typescript
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const contract = await deploy("MyContract", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log("Deployed to:", contract.address);
};

deploy.tags = ["all"];
export default deploy;
```

Then run:

```bash
npx hardhat deploy
```

## FHE Patterns

### Encrypted Value Handling

```solidity
// Receive encrypted input with proof
function setSecret(externalEuint32 secret, bytes calldata proof) external {
    // Convert external to internal
    euint32 value = FHE.fromExternal(secret, proof);

    // Store encrypted value
    secrets[msg.sender] = value;

    // Grant permissions (CRITICAL!)
    FHE.allowThis(secrets[msg.sender]);
    FHE.allow(secrets[msg.sender], msg.sender);
}
```

### Key Points

- ✅ Always call `FHE.allowThis()` for contract access
- ✅ Always call `FHE.allow()` for user access
- ✅ Validate input proofs with `FHE.fromExternal()`
- ✅ Keep encrypted data private
- ❌ Don't expose encrypted values from view functions
- ❌ Don't forget permissions
- ❌ Don't mix encrypted types without casting

## Testing

### Run All Tests

```bash
npm run test
```

### Run Specific Test

```bash
npm run test test/MyContract.ts
```

### With Coverage

```bash
npm run coverage
```

### Debug Tests

```bash
npm run test:debug
```

## Gas Reporting

Enable gas reporting:

```bash
REPORT_GAS=true npm run test
```

## Type Safety

TypeChain automatically generates TypeScript types for your contracts:

```typescript
import { MyContract } from "../typechain-types";

const contract: MyContract = await ethers.getContractAt(
  "MyContract",
  contractAddress
);
```

## Documentation

- **FHEVM Docs**: https://docs.zama.ai/fhevm
- **Hardhat Docs**: https://hardhat.org/docs
- **Solidity Docs**: https://docs.soliditylang.org
- **ethers.js**: https://docs.ethers.org/v6

## Support

- **Documentation**: https://docs.zama.ai/fhevm
- **Discord**: https://discord.com/invite/zama
- **Forum**: https://www.zama.ai/community
- **GitHub**: https://github.com/zama-ai

## License

BSD-3-Clause-Clear License

---

**Ready to build?** Start with the example contracts and modify them for your use case!
