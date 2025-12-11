# Developer Program Bounty Track December 2025: Build Anonymous Membership System with FHEVM

The Zama Bounty Program aims to inspire and incentivize the developer community to contribute to the Zama Confidential Blockchain Protocol.

Each season, we introduce a new bounty that addresses a specific challenge. With this initiative, we invite developers to collaborate with us in advancing the FHE ecosystem.

For this season's challenge, we invite developers to **build a comprehensive Anonymous Membership System using Fully Homomorphic Encryption (FHEVM), demonstrating privacy-preserving access control, membership verification, and confidential data handling, with clean tests, automated scaffolding, and self-contained documentation**. The prize pool for this challenge is **$10,000.**

---

## Important Dates

- **Start date:** December 1, 2025
- **Submission deadline:** December 31, 2025 (23:59, Anywhere On Earth)

---

## Overview

The goal of this bounty is to create a complete system for building an Anonymous Membership platform that leverages FHEVM to provide privacy-preserving access control and membership verification. Developers should create comprehensive documentation, working examples, and automation tools that enable others to understand and build similar privacy-preserving membership systems.

### Key Focus Areas

A starter example implementation demonstrates:
- Privacy-preserving membership verification without exposing user identities
- Encrypted access control mechanisms using FHE
- Confidential balance or privilege tracking
- Member authentication with zero-knowledge proofs
- Documentation generation from code annotations
- Complete test suites showing both correct usage and common pitfalls

---

## How to Participate

Participants should create a repository containing:

1. **Core Smart Contracts** - Well-documented Solidity contracts implementing privacy-preserving membership functionality
2. **Comprehensive Tests** - Test suites demonstrating correct usage and common pitfalls
3. **Automation Scripts** - TypeScript-based CLI tools for generating example repositories
4. **Documentation Generator** - Tool to create GitBook-compatible documentation
5. **Base Template** - Using the FHEVM Hardhat template that can be cloned and customized

### Key Implementation Areas

Check out reference materials to understand:
- How to structure membership verification contracts
- How to implement access control patterns
- How to generate automation scripts
- How to create comprehensive documentation
- How to test privacy-preserving functionality

---

## Requirements

### 1. Project Structure & Simplicity

- **Use only Hardhat** for all examples
- **One repo per example**, no monorepo structure
- Keep each repo minimal: `contracts/`, `test/`, `hardhat.config.ts`, `package.json`, etc.
- Use a shared `base-template` that can be cloned and scaffolded
- Generate documentation similar to professional technical references

### 2. Scaffolding / Automation

Create a CLI or script (`create-membership-example`) to:
- Clone and customize the base Hardhat template
- Insert specific membership Solidity contracts into `contracts/`
- Generate matching test files
- Auto-generate documentation from code annotations
- Create deployment scripts

**Example:** Implement `create-membership-example.ts` and `create-membership-category.ts` scripts in TypeScript.

### 3. Core Features to Implement

**(Each major feature can become a standalone repository example)**:

#### Basic Membership Features:

**Member Registration & Verification:**
- Member registration with encrypted credentials
- Privacy-preserving membership verification
- Encrypted member data storage
- Member enumeration without revealing identities

**Access Control:**
- Role-based access control using FHEVM
- Encrypted permission levels
- FHE.allow and FHE.allowTransient patterns
- Dynamic permission management

**Membership States:**
- Active/inactive member tracking (encrypted)
- Member tier or privilege levels (encrypted)
- Membership expiration with privacy preservation
- Member activity tracking

#### Intermediate Features:

**Advanced Access Control:**
- Hierarchical membership structures
- Encrypted delegation of permissions
- Member group management
- Conditional access based on encrypted state

**Confidential Operations:**
- Encrypted voting or polling within membership
- Confidential treasury or balance management
- Privacy-preserving member communication
- Encrypted audit logs

**Input Proof Patterns:**
- Correct use of input proofs for membership verification
- Avoiding proof-related pitfalls
- Binding checks for encrypted membership data

#### Advanced Examples:

**Complex Membership Systems:**
- Multi-tier membership with confidential requirements
- Privacy-preserving membership transfers
- Encrypted membership upgrades
- Confidential member rewards system

**OpenZeppelin Integration:**
- ERC7984 confidential token integration
- Confidential token-gated membership
- Privacy-preserving token wrapping
- Advanced payment mechanisms for membership

---

### 4. Documentation Strategy

- Use JSDoc/TSDoc-style comments in TypeScript tests
- Auto-generate markdown documentation per example
- Tag key concepts: "chapter: access-control", "chapter: verification", etc.
- Generate GitBook-compatible documentation structure
- Create clear examples showing anti-patterns and correct usage

**Documentation should cover:**
- What is the Anonymous Membership System
- Core FHEVM concepts as they apply to membership
- Privacy guarantees and threat model
- Common pitfalls and how to avoid them
- Step-by-step guides for implementation
- Complete API reference

---

## Bonus Points

Earn additional recognition for:

- **Creative Implementation** - Unique approaches to membership systems
- **Advanced Patterns** - Demonstrating sophisticated privacy techniques
- **Clean Automation** - Particularly elegant and maintainable scripts
- **Comprehensive Documentation** - Exceptional clarity and depth
- **Testing Coverage** - Extensive test coverage including edge cases
- **Error Handling** - Examples demonstrating common mistakes and solutions
- **Category Organization** - Well-organized examples for different use cases
- **Maintenance Tools** - Tools for updating examples when dependencies change
- **User Interface** - Example frontend or dashboard for membership management
- **Integration Examples** - Integration with external services or protocols

---

## Judging Criteria

All submissions **must include a demonstration video** as a mandatory requirement. The video should clearly showcase:
- Project setup and compilation
- Key membership features in action
- Example execution and testing
- Automation scripts functionality
- Documentation generation

### Evaluation Metrics

Judging will be based on:

- **Code Quality** - Clean, well-documented, following best practices
- **Automation Completeness** - Robust and maintainable scripts
- **Example Quality** - Clear demonstration of membership concepts
- **Documentation** - Clarity, completeness, and usefulness
- **Privacy Assurance** - Proper use of FHEVM patterns
- **Ease of Maintenance** - Handling version changes and updates
- **Innovation** - Creative approaches to the membership problem

---

## Deliverables

Your submission must include:

1. **`base-template/`** - Complete Hardhat template with `@fhevm/solidity`
2. **Automation Scripts** - TypeScript-based creation and generation tools
3. **Example Repositories** - Multiple working membership examples (or category-based projects)
4. **Documentation** - Auto-generated documentation per example
5. **Developer Guide** - Instructions for adding new features and updating dependencies
6. **Automation Tools** - Complete set of scripts for scaffolding and generation
7. **Demonstration Video** - Showcasing the system in action

---

## Reference Materials

Use the following as references:

- **FHEVM Protocol Examples**: Official FHEVM documentation and examples
- **Base Template**: Standard FHEVM Hardhat template
- **Existing dApps**: Community FHEVM implementations
- **OpenZeppelin Confidential Contracts**: Confidential token standards and utilities
- **Example Projects**: Reference implementations demonstrating similar patterns

---

## Rewards

- 🥇 **1st Place:** $5,000
- 🥈 **2nd Place:** $3,000
- 🥉 **3rd Place:** $2,000

---

## How to Participate

Submit your project through the official Zama Developer Program submission portal with:
- Link to your GitHub repository
- Demonstration video
- Brief project description
- Setup and testing instructions

---

## Additional Resources

- **Zama Developer Program**: Developer community and support
- **Zama Community Forum**: Technical discussions and support
- **Zama Discord Server**: Real-time community interaction
- **Official Documentation**: Complete FHEVM guides and references

---

## Tips for Success

1. **Start Simple** - Begin with basic membership verification before adding complexity
2. **Test Thoroughly** - Cover both success and failure cases
3. **Document Well** - Clear documentation is essential for participants
4. **Follow Patterns** - Use proven FHEVM patterns from examples
5. **Maintain Quality** - Focus on clean, understandable code
6. **Iterate Gradually** - Build complexity step-by-step
7. **Engage Community** - Discuss approaches and get feedback

---

Good luck with your submission! 🚀

---

**Built with intention for the FHE ecosystem by developers like you**
