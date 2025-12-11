# Quick Start Guide - Anonymous Membership System

Get up and running with the Anonymous Membership System in minutes!

## Installation (2 minutes)

```bash
# 1. Clone repository
git clone <repository-url>
cd AnonymousMembership

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your configuration

# 4. Verify installation
npm run compile
npm run test
```

## First Example (1 minute)

```bash
# Generate your first standalone example
npm run create-example basic-member ./my-first-example

# Navigate and test
cd my-first-example
npm install
npm run compile
npm run test
```

## Create Documentation (1 minute)

```bash
# Generate documentation for an example
npm run generate-docs basic-member

# Generate all documentation
npm run generate-docs --all

# View generated docs in docs/ directory
```

## Available Commands

### Development
| Command | Purpose |
|---------|---------|
| `npm run compile` | Compile all contracts |
| `npm run test` | Run test suite |
| `npm run test:debug` | Run tests with verbose output |
| `npm run coverage` | Generate coverage report |
| `npm run lint` | Run solhint linting |
| `npm run clean` | Clean build artifacts |
| `npm run node` | Start local FHEVM node |

### Generation
| Command | Purpose |
|---------|---------|
| `npm run create-example <name> <path>` | Generate single example |
| `npm run create-category <category> <path>` | Generate category |
| `npm run generate-docs <name>` | Generate documentation |
| `npm run generate-docs --all` | Generate all documentation |
| `npm run help:examples` | List available examples |
| `npm run help:category` | List available categories |

## Project Structure

```
AnonymousMembership/
├── contracts/          # Smart contracts by category
├── test/              # Test files
├── scripts/           # Automation tools
├── docs/              # Generated documentation
├── hardhat.config.ts  # Hardhat configuration
├── package.json       # Dependencies
└── README.md          # Full documentation
```

## Key Files

- **BOUNTY_DESCRIPTION.md** - Competition requirements
- **CONTRIBUTING.md** - Development guidelines
- **SUBMISSION_GUIDE.md** - How to submit
- **scripts/README.md** - Automation tool documentation

## Concepts

### Three Privacy Levels

**Basic**: Simple membership registration
- See: `contracts/basic/SimpleMembership.sol`
- Test: `test/basic/SimpleMembership.ts`

**Intermediate**: Access control patterns
- See: `contracts/access-control/RoleBasedAccess.sol`
- Test: Examples in test/access-control/

**Advanced**: Complex privacy patterns
- See: `contracts/advanced/`
- Test: Examples in test/advanced/

## FHE Pattern Quick Reference

### ✅ Correct Pattern

```solidity
// 1. Receive encrypted input with proof
function registerMember(externalEuint32 encrypted, bytes calldata proof) external {
    // 2. Convert to internal encrypted type
    euint32 value = FHE.fromExternal(encrypted, proof);

    // 3. Store encrypted value
    memberStatus[msg.sender] = value;

    // 4. ALWAYS grant permissions!
    FHE.allowThis(memberStatus[msg.sender]);
    FHE.allow(memberStatus[msg.sender], msg.sender);
}
```

### ❌ Common Mistakes

```solidity
// ❌ Missing FHE.allowThis - will fail!
FHE.allow(value, msg.sender);

// ❌ Exposing encrypted value from view function - not allowed!
function getValue() public view returns (euint32) {
    return _encryptedValue; // This won't work in view functions
}

// ❌ Mismatched encryption binding
// Alice encrypts, Bob submits - will fail!
```

## Testing Your Code

```bash
# Run all tests
npm run test

# Run specific test file
npm run test test/basic/SimpleMembership.ts

# Run with verbose output
npm run test:debug

# Generate coverage report
npm run coverage
```

## Generating Examples

### Single Example

```bash
# Create basic-member example
npm run create-example basic-member ./output/basic-member

# The created project is standalone and ready to use
cd output/basic-member
npm install
npm run test
```

### Category

```bash
# Create all basic examples
npm run create-category basic ./output/basic-examples

# Create all access control examples
npm run create-category access-control ./output/access-examples
```

## Building for Competition

### 1. Prepare Code
```bash
npm run compile
npm run test
npm run lint
npm run coverage
```

### 2. Generate Examples
```bash
npm run create-example basic-member ./test-output
cd test-output
npm install && npm run test
cd ..
rm -rf test-output
```

### 3. Generate Documentation
```bash
npm run generate-docs --all
```

### 4. Create Video
- Record setup and compilation
- Show example generation
- Run tests
- Demonstrate features

### 5. Submit
See SUBMISSION_GUIDE.md for detailed instructions

## Troubleshooting

### "Command not found"
```bash
# Make sure you're in the right directory
pwd  # Should be AnonymousMembership

# Reinstall dependencies
npm install

# Try again
npm run <command>
```

### "Cannot find module"
```bash
# Clear cache and reinstall
npm run clean
rm -rf node_modules package-lock.json
npm install
```

### "Tests fail"
```bash
# Check compilation first
npm run compile

# Run specific test
npm run test test/basic/SimpleMembership.ts

# Run with debug info
npm run test:debug
```

### "Port already in use"
```bash
# If running local node
npm run node

# Use different port
npx hardhat node --port 8546
```

## Next Steps

1. **Learn Concepts**
   - Read BOUNTY_DESCRIPTION.md
   - Review SimpleMembership.sol

2. **Explore Examples**
   - Review example contracts
   - Study test files
   - Understand FHE patterns

3. **Try Generation**
   - Generate an example
   - Modify and test it
   - Create your own

4. **Contribute**
   - Create new examples
   - Improve documentation
   - Follow CONTRIBUTING.md

## Resources

- **FHEVM Docs**: https://docs.zama.ai/fhevm
- **Hardhat Guide**: https://hardhat.org/docs
- **Solidity Handbook**: https://docs.soliditylang.org

## Getting Help

- **Documentation**: Check relevant .md files
- **Community**: Zama Discord or Forum
- **Issues**: GitHub Issues section

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `contracts/` | Smart contract source code |
| `test/` | Test files |
| `scripts/` | Automation tools |
| `docs/` | Generated documentation |
| `deploy/` | Deployment scripts |

## Environment Setup

```bash
# Set your MNEMONIC for account management
npx hardhat vars set MNEMONIC

# Set INFURA_API_KEY for network access
npx hardhat vars set INFURA_API_KEY

# Optional: ETHERSCAN_API_KEY for verification
npx hardhat vars set ETHERSCAN_API_KEY
```

---

**Ready to start?** Run `npm install` and you're good to go! 🚀

For detailed information, see the full README.md
