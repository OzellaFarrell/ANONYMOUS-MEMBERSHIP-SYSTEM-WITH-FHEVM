# Developer Guide: Adding New Examples and Updating Dependencies

This guide explains how to contribute new examples and maintain the project when dependencies change.

---

## Adding New Examples

### Step 1: Create Contract File

Create your contract in the appropriate category directory:

```bash
# For basic examples
touch contracts/basic/YourExample.sol

# For advanced examples
touch contracts/advanced/YourExample.sol

# For access control examples
touch contracts/access-control/YourExample.sol
```

### Step 2: Write the Contract

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title YourExample
/// @notice Brief description
/// @dev Detailed explanation
contract YourExample is ZamaEthereumConfig {
  // Implementation
}
```

**Include:**
- Clear NatSpec comments
- Explain FHE patterns used
- Document privacy guarantees
- Show correct usage

### Step 3: Create Test File

Create corresponding test in `test/<category>/YourExample.ts`:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { createFhevmInstance } from "@fhevm/hardhat-plugin";

describe("YourExample", function () {
  let contract;
  let signer;
  let fhevm;

  before(async function () {
    fhevm = await createFhevmInstance();
    [signer] = await ethers.getSigners();

    const YourExample = await ethers.getContractFactory("YourExample");
    contract = await YourExample.deploy();
  });

  it("should perform operation correctly", async function () {
    // Test implementation
  });
});
```

**Include:**
- Success cases
- Failure cases
- Edge cases
- Privacy verification

### Step 4: Update Scripts

Update `scripts/create-membership-example.ts`:

```typescript
const EXAMPLES_MAP = {
  'your-example': {
    name: 'Your Example Title',
    description: 'Short description',
    contract: 'contracts/basic/YourExample.sol',
    test: 'test/basic/YourExample.ts',
    category: 'basic'
  },
  // ... existing examples
};
```

Update `scripts/create-membership-category.ts`:

```typescript
const CATEGORIES_MAP = {
  'basic': {
    name: 'Basic Examples',
    description: 'Fundamental patterns',
    examples: [
      'simple-membership',
      'fhe-arithmetic',
      'equality-comparison',
      'your-example'  // Add here
    ]
  },
  // ... other categories
};
```

Update `scripts/generate-docs.ts`:

```typescript
const EXAMPLES_CONFIG = {
  'your-example': {
    title: 'Your Example',
    description: 'Description',
    contractPath: 'contracts/basic/YourExample.sol',
    testPath: 'test/basic/YourExample.ts',
    category: 'basic'
  },
  // ... other examples
};
```

### Step 5: Test Standalone Generation

```bash
npm run create-example your-example ./test-output
cd test-output
npm install
npm run compile
npm run test
cd ..
rm -rf test-output
```

### Step 6: Generate Documentation

```bash
npm run generate-docs your-example
```

### Step 7: Update Main Documentation

Add entry to `README.md`:

```markdown
### Your Example Category
- **Your Example** - Brief description of what it demonstrates
```

---

## Updating Dependencies

### When FHEVM Releases New Version

1. **Update Base Template Package**

```bash
cd base-template
npm update @fhevm/solidity
npm update @fhevm/hardhat-plugin
npm install
npm run compile
npm run test
```

2. **Test With Key Examples**

```bash
# Test a few representative examples
npm run create-example simple-membership ./test-new
cd test-new && npm install && npm run test
cd ..
rm -rf test-new

npm run create-example blind-auction ./test-new
cd test-new && npm install && npm run test
cd ..
rm -rf test-new
```

3. **Check for Breaking Changes**

Review:
- FHEVM changelog
- Solidity library API changes
- Plugin behavior changes
- New/deprecated functions

4. **Update Contracts if Needed**

If API changed, update all contracts:

```bash
# Example: Replace deprecated function
sed -i 's/FHE.old/FHE.new/g' contracts/**/*.sol
```

5. **Run Full Test Suite**

```bash
npm run compile
npm run test
npm run lint
```

6. **Update Documentation**

```bash
npm run generate-docs --all
```

7. **Update README**

Document version changes in README.md:

```markdown
## Technology Stack

### Updated: [Date]
- @fhevm/solidity v0.X.X → v0.Y.Y
  - Breaking change: Function X deprecated, use Y instead
  - Enhancement: New function Z available
```

8. **Commit Changes**

```bash
git add .
git commit -m "Update to FHEVM v0.Y.Y

- Updated all dependencies
- All tests passing
- Documentation regenerated"
```

---

## Code Standards

### Solidity

- Use NatSpec comments
- Clear variable names
- Proper FHE patterns
- Security best practices
- Clear access control

### TypeScript

- Strict type checking
- Proper error handling
- Clear comments
- Consistent formatting
- ESLint compliance

### Tests

- Success and failure cases
- Privacy verification
- Edge cases
- Clear comments
- Descriptive test names

---

## Documentation Standards

### Code Comments

```solidity
/// @notice What the function does
/// @dev How it works internally
/// @param paramName What this parameter is
/// @return Description of return value
```

### README Per Example

Include:
- What it demonstrates
- When to use it
- How it works
- Important concepts
- Common pitfalls

---

## Validation Checklist

Before pushing changes:

```bash
# Code quality
npm run compile
npm run test
npm run lint
npm run coverage

# Example generation
npm run create-example your-example ./test-output
cd test-output && npm install && npm run compile && npm run test

# Documentation
npm run generate-docs your-example

# Git
git status
git diff
```

---

## Common Tasks

### Add to Existing Category

```bash
# 1. Create files in category directory
touch contracts/basic/YourExample.sol
touch test/basic/YourExample.ts

# 2. Update scripts
# Edit EXAMPLES_MAP in create-membership-example.ts
# Edit examples list in CATEGORIES_MAP
# Add to EXAMPLES_CONFIG in generate-docs.ts

# 3. Test
npm run compile
npm run test

# 4. Generate docs
npm run generate-docs your-example
```

### Create New Category

```bash
# 1. Create directories
mkdir -p contracts/your-category
mkdir -p test/your-category

# 2. Add examples to directories
touch contracts/your-category/Example1.sol
touch test/your-category/Example1.ts

# 3. Add category to scripts
# Add new entry to CATEGORIES_MAP

# 4. Test category generation
npm run create-category your-category ./test-output
```

### Update Single Contract

```bash
# 1. Edit contract
vim contracts/category/Contract.sol

# 2. Update test if needed
vim test/category/Contract.ts

# 3. Test
npm run compile
npm run test -- contracts/category/Contract.ts

# 4. Regenerate docs
npm run generate-docs example-name
```

---

## Troubleshooting

### Compilation Fails After Update

1. Check changelog for breaking changes
2. Review error messages carefully
3. Compare with example implementations
4. Check import statements are correct
5. Verify function signatures match new API

### Tests Fail After Update

1. Check FHE behavior changes
2. Verify test patterns still valid
3. Update test utilities if needed
4. Check permission handling
5. Verify proof generation still works

### Scripts Don't Generate

1. Verify example is in EXAMPLES_MAP
2. Check file paths are correct
3. Ensure contracts compile
4. Verify test files exist
5. Check documentation format

---

## Getting Help

- Check existing examples for patterns
- Review FHEVM documentation
- Ask in community forums
- Check GitHub issues
- Review test implementations

---

**Last Updated**: December 2025
