# Contributing to Anonymous Membership System

We welcome contributions to the Anonymous Membership System project! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain respectful and professional conduct in all interactions.

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm, yarn, or pnpm
- Git
- Basic understanding of Solidity and FHEVM

### Setup Development Environment

```bash
# Clone repository
git clone <repository-url>
cd AnonymousMembership

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Verify setup
npm run compile
npm run test
```

## Contribution Types

### 1. Adding New Membership Examples

New examples should demonstrate clear FHEVM concepts.

**Steps:**

1. **Create Contract**
   ```bash
   touch contracts/category/YourExample.sol
   ```

2. **Write Comprehensive Contract**
   - Add clear documentation comments
   - Explain privacy guarantees
   - Show correct FHE patterns
   - Include security considerations

3. **Create Test Suite**
   ```bash
   touch test/category/YourExample.ts
   ```

4. **Write Complete Tests**
   - Success cases with detailed comments
   - Failure cases demonstrating error handling
   - Privacy verification tests
   - FHE pattern demonstrations
   - Common pitfall examples

5. **Update Scripts**
   - Add to EXAMPLES_MAP in `scripts/create-membership-example.ts`
   - Add to CATEGORIES_MAP if new category
   - Add to EXAMPLES_CONFIG in `scripts/generate-docs.ts`

6. **Generate Documentation**
   ```bash
   npm run generate-docs your-example
   ```

7. **Test Standalone Repository**
   ```bash
   npm run create-example your-example ./test-output
   cd test-output
   npm install && npm run compile && npm run test
   ```

### 2. Improving Documentation

Documentation improvements help developers understand the system.

**Areas for improvement:**
- Clarifying concepts
- Adding examples
- Fixing typos
- Enhancing guides
- Adding diagrams or visuals

**Process:**
1. Edit relevant markdown files
2. Test documentation generation
3. Verify GitBook formatting
4. Submit pull request

### 3. Bug Fixes

Found a bug? Help us fix it!

**Steps:**
1. Create issue describing bug
2. Create branch: `fix/bug-description`
3. Fix the issue
4. Test thoroughly
5. Submit pull request with explanation

### 4. Performance Improvements

Help optimize the system.

**Areas:**
- Compilation optimization
- Test execution speed
- Script efficiency
- Documentation generation
- Code organization

### 5. Test Coverage

Improve test coverage and quality.

**Ideas:**
- Add edge case tests
- Improve error messages
- Add integration tests
- Enhance privacy verification tests

## Code Standards

### Solidity

**Style:**
```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32 } from "@fhevm/solidity/lib/FHE.sol";

/// @title Clear title
/// @notice Purpose and usage
/// @dev Implementation details
contract MyContract {
  /// @notice Clear function description
  /// @param param Parameter description
  /// @return Description of return value
  function myFunction(uint256 param) external returns (bool) {
    // Implementation
  }
}
```

**Requirements:**
- Use NatSpec comments
- Clear variable names
- Proper access control
- Security best practices
- FHEVM pattern compliance

### TypeScript

**Style:**
```typescript
/**
 * Clear description of function
 * @param input Input description
 * @returns What it returns
 */
function myFunction(input: string): Promise<void> {
  // Implementation
}
```

**Requirements:**
- Strict TypeScript mode
- Proper type annotations
- Error handling
- Clear naming

### Tests

**Pattern:**
```typescript
describe("Feature", function () {
  /**
   * ✅ SUCCESS: Brief description
   * - Detail about what happens
   * - Expected outcome
   */
  it("should do something", async function () {
    // Test implementation
  });

  /**
   * ❌ FAILURE: Brief description
   * - What should fail
   * - Why it should fail
   */
  it("should not allow invalid input", async function () {
    // Test implementation
  });

  /**
   * 🔒 PRIVACY: Brief description
   * - Privacy guarantee
   * - How it's protected
   */
  it("should maintain encryption", async function () {
    // Test implementation
  });
});
```

## Documentation Standards

### Code Comments

```solidity
/// @notice What the function does
/// @dev How it works internally
/// @param paramName What this parameter is
/// @return Description of return value
```

### Markdown

- Clear headings
- Code blocks with language specification
- Linked references
- Practical examples
- Security notes in blockquotes

## Git Workflow

### Branch Naming

- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Refactoring

### Commit Messages

```
type(scope): brief description

Longer explanation if needed.
- Bullet point if helpful
- Another bullet point

Closes #issue-number
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `test:` Test changes
- `refactor:` Code refactoring
- `perf:` Performance improvement

### Pull Requests

1. **Descriptive Title**
   - Clear what changes are being made

2. **Detailed Description**
   - Why the change is needed
   - How it works
   - Testing performed

3. **Related Issues**
   - Link to related issues
   - Reference discussions

4. **Checklist**
   - Code follows standards
   - Tests pass
   - Documentation updated
   - No breaking changes

## Testing

### Run Tests

```bash
npm run test
```

### Run Specific Test

```bash
npm run test test/basic/SimpleMembership.ts
```

### Coverage Report

```bash
npm run coverage
```

### Debug Tests

```bash
npm run test:debug
```

## Privacy and Security

All contributions must:

1. **Respect Privacy**
   - Maintain encryption invariants
   - Don't expose encrypted data
   - Preserve member anonymity

2. **Follow FHE Patterns**
   - Use FHE.allow correctly
   - Verify input proofs
   - Document security assumptions

3. **Consider Security**
   - No hardcoded values
   - Proper access control
   - Input validation

## Review Process

1. **Automated Checks**
   - Code compiles
   - Tests pass
   - Linting passes

2. **Code Review**
   - Standard compliance
   - Security review
   - Documentation review
   - Functionality verification

3. **Approval**
   - At least one approval
   - All checks pass
   - No unresolved comments

4. **Merge**
   - Squash commits if appropriate
   - Delete feature branch
   - Update relevant documentation

## Reporting Issues

### Bug Reports

Include:
- Clear description
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment info

### Feature Requests

Include:
- Clear description
- Use case
- Proposed solution
- Alternatives considered

### Security Issues

**Do not open public issues for security problems**

Instead:
- Email security team
- Include reproduction details
- Allow time for fix before disclosure

## Resources

- **FHEVM Docs**: https://docs.zama.ai/fhevm
- **Hardhat Docs**: https://hardhat.org
- **Solidity Patterns**: https://solidity-patterns.readthedocs.io

## Questions?

- Check existing issues
- Review documentation
- Ask in community forums
- Contact maintainers

## Recognition

Contributors are recognized in:
- README.md
- Release notes
- Community announcements

Thank you for contributing to privacy-preserving technology! 🙏

---

**Last Updated**: December 2025
