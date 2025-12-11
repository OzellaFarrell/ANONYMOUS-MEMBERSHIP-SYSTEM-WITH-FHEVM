# Automation Scripts Documentation

This directory contains TypeScript scripts for automating the creation and management of Anonymous Membership FHEVM example repositories.

## Overview

The automation framework provides three main tools:

1. **create-membership-example.ts** - Generate standalone example repositories
2. **create-membership-category.ts** - Generate category-based projects with multiple examples
3. **generate-docs.ts** - Auto-generate GitBook documentation

## Scripts

### create-membership-example.ts

Generates a complete standalone repository for a single membership example.

**Usage:**

```bash
ts-node scripts/create-membership-example.ts <example-name> <output-path>
```

**Examples:**

```bash
# Generate basic membership example
ts-node scripts/create-membership-example.ts basic-member ./output/basic-member

# Generate access control example
ts-node scripts/create-membership-example.ts role-based-access ./output/role-access

# Show available examples
ts-node scripts/create-membership-example.ts --list
```

**Features:**

- Clones base Hardhat template
- Copies specific contract and test files
- Updates hardhat.config.ts
- Generates README.md
- Creates deployment scripts
- Sets up npm scripts

**Output Structure:**

```
output/basic-member/
├── contracts/
│   └── SimpleMembership.sol
├── test/
│   └── SimpleMembership.ts
├── deploy/
├── hardhat.config.ts
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

### create-membership-category.ts

Generates a project containing multiple related examples from a category.

**Usage:**

```bash
ts-node scripts/create-membership-category.ts <category> <output-path>
```

**Examples:**

```bash
# Generate basic membership examples
ts-node scripts/create-membership-category.ts basic ./output/basic-examples

# Generate access control examples
ts-node scripts/create-membership-category.ts access-control ./output/access-examples

# Show available categories
ts-node scripts/create-membership-category.ts --list
```

**Available Categories:**

| Category | Description | Examples |
| --- | --- | --- |
| `basic` | Basic membership operations | SimpleMembership, MemberVerification, MemberStatus |
| `access-control` | Access control patterns | RoleBasedAccess, PermissionGrant, HierarchicalAccess |
| `advanced` | Advanced patterns | ConfidentialVoting, PrivateTreasury, MemberRewards |
| `integration` | Integration examples | TokenGatedMembership, VestingMembership |

**Features:**

- Clones base template
- Copies multiple contracts and tests
- Includes comprehensive README
- Unified deployment script
- Category-level documentation

**Output Structure:**

```
output/basic-examples/
├── contracts/
│   ├── SimpleMembership.sol
│   ├── MemberVerification.sol
│   └── MemberStatus.sol
├── test/
│   ├── SimpleMembership.ts
│   ├── MemberVerification.ts
│   └── MemberStatus.ts
├── deploy/
├── hardhat.config.ts
├── package.json
├── README.md
└── CATEGORY_GUIDE.md
```

### generate-docs.ts

Generates GitBook-compatible documentation from code.

**Usage:**

```bash
ts-node scripts/generate-docs.ts [example-name | --all]
```

**Examples:**

```bash
# Generate docs for single example
ts-node scripts/generate-docs.ts basic-member

# Generate docs for all examples
ts-node scripts/generate-docs.ts --all

# Show available examples for documentation
ts-node scripts/generate-docs.ts --list
```

**Features:**

- Extracts contract code
- Extracts test code
- Generates formatted markdown
- Creates navigation (SUMMARY.md)
- Organizes by category
- Includes explanatory text

**Generated Documentation Structure:**

```
docs/
├── SUMMARY.md                    # Navigation index
├── basic/
│   ├── basic-member.md
│   ├── member-verification.md
│   └── member-status.md
├── access-control/
│   ├── role-based-access.md
│   ├── permission-grant.md
│   └── hierarchical-access.md
└── advanced/
    ├── confidential-voting.md
    ├── private-treasury.md
    └── member-rewards.md
```

**Output Format:**

Documentation includes:

- **Overview** - Purpose and use case
- **Concepts** - Key FHEVM concepts
- **Contract Code** - Full contract with comments
- **Test Code** - Complete test suite with explanations
- **Common Patterns** - Usage patterns and best practices
- **Privacy Guarantees** - What is protected and how

## Configuration Files

### Example Configuration

The scripts read from configuration objects that map examples to their files:

```typescript
// In create-membership-example.ts
const EXAMPLES_MAP = {
  'basic-member': {
    name: 'Basic Member Registration',
    description: 'Simple membership registration with encrypted status',
    contract: 'contracts/basic/SimpleMembership.sol',
    test: 'test/basic/SimpleMembership.ts',
    category: 'basic'
  },
  // ... more examples
};
```

### Category Configuration

```typescript
// In create-membership-category.ts
const CATEGORIES_MAP = {
  'basic': {
    name: 'Basic Membership Examples',
    description: 'Fundamental membership operations',
    examples: ['basic-member', 'member-verification', 'member-status']
  },
  // ... more categories
};
```

## Development Workflow

### Adding a New Example

1. **Create Contract**
   ```bash
   vim contracts/[category]/YourExample.sol
   ```

2. **Create Tests**
   ```bash
   vim test/[category]/YourExample.ts
   ```

3. **Update Configurations**
   - Add to EXAMPLES_MAP in create-membership-example.ts
   - Add to category in create-membership-category.ts
   - Add to EXAMPLES_CONFIG in generate-docs.ts

4. **Generate Documentation**
   ```bash
   npm run generate-docs your-example
   ```

5. **Test Standalone**
   ```bash
   npm run create-example your-example ./test-output
   cd test-output
   npm install && npm run test
   ```

### Adding a New Category

1. **Create Subdirectory**
   ```bash
   mkdir -p contracts/your-category
   mkdir -p test/your-category
   ```

2. **Create Examples in Category**
   - Add contracts and tests

3. **Update CATEGORIES_MAP**
   - Add category definition with example list

4. **Test Generation**
   ```bash
   npm run create-category your-category ./test-output
   cd test-output
   npm install && npm test
   ```

## Automation Best Practices

### Code Organization

- **One responsibility per contract** - Clear, focused functionality
- **Clear naming** - Descriptive file and contract names
- **Comprehensive comments** - Explain FHE patterns and decisions

### Documentation Standards

- **JSDoc/TSDoc style** - Use standard comment format
- **Include privacy notes** - Explain what stays encrypted
- **Show examples** - Both correct and incorrect patterns
- **Link related concepts** - Cross-reference similar examples

### Testing Patterns

- **Success cases** - Demonstrate correct usage
- **Error cases** - Show failure conditions
- **Privacy verification** - Demonstrate encryption guarantees
- **FHE patterns** - Show correct FHE usage

## Troubleshooting

### Script Errors

**"Example not found"**
- Check example name spelling
- Run `--list` to see available examples
- Verify files exist in contracts/ and test/

**"Category not found"**
- Check category name spelling
- Run `--list` to see available categories
- Verify examples in category exist

### Generation Issues

**"Failed to copy files"**
- Check file paths in configuration
- Ensure contracts/ and test/ directories exist
- Verify file permissions

**"Documentation not generated"**
- Check example exists in EXAMPLES_CONFIG
- Verify code has proper comments
- Check output directory is writable

### Hardhat Issues

**"Cannot find module '@fhevm/solidity'"**
- Run `npm install` in generated project
- Check Node.js version (≥20 required)

**"Compilation failed"**
- Verify contract syntax
- Check imports are correct
- Ensure Solidity version matches (^0.8.24)

## Advanced Usage

### Batch Operations

Generate multiple examples at once:

```bash
for example in basic-member member-verification role-based-access; do
  npm run create-example $example ./output/$example
done
```

### Continuous Integration

Automate testing in CI/CD:

```bash
npm run create-example basic-member ./ci-test
cd ci-test
npm install
npm run compile
npm run test
```

### Documentation Regeneration

Update all documentation when code changes:

```bash
npm run generate-docs --all
```

## Contributing

When creating or modifying scripts:

1. Maintain TypeScript strict mode
2. Add error handling and validation
3. Provide clear error messages
4. Update this README
5. Test with multiple examples
6. Verify generated projects work

## References

- [Hardhat Documentation](https://hardhat.org)
- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

**Last Updated**: December 2025
