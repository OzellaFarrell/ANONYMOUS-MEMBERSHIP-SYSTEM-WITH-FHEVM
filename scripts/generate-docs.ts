#!/usr/bin/env ts-node

/**
 * generate-docs.ts
 * Auto-generates GitBook-compatible documentation from code
 *
 * Usage:
 *   ts-node scripts/generate-docs.ts <example-name>
 *   ts-node scripts/generate-docs.ts --all
 *   ts-node scripts/generate-docs.ts --list
 */

import * as fs from "fs";
import * as path from "path";

/// Documentation configuration
interface DocConfig {
  example: string;
  contract: string;
  test: string;
  title: string;
  category: string;
  description: string;
}

/// All documentation configurations
const DOCS_CONFIG: Record<string, DocConfig> = {
  "basic-member": {
    example: "basic-member",
    contract: "contracts/basic/SimpleMembership.sol",
    test: "test/basic/SimpleMembership.ts",
    title: "Basic Member Registration",
    category: "basic",
    description:
      "Simple membership registration with encrypted status. Learn the fundamental patterns of privacy-preserving membership.",
  },
  "fhe-arithmetic": {
    example: "fhe-arithmetic",
    contract: "contracts/basic/FHEArithmetic.sol",
    test: "test/basic/FHEArithmetic.ts",
    title: "FHE Arithmetic Operations",
    category: "basic",
    description: "Demonstrates encrypted arithmetic operations (add, subtract, multiply) on FHE data.",
  },
  "equality-comparison": {
    example: "equality-comparison",
    contract: "contracts/basic/EqualityComparison.sol",
    test: "test/basic/EqualityComparison.ts",
    title: "Encrypted Equality Comparison",
    category: "basic",
    description: "Shows how to compare encrypted values for equality without decryption.",
  },
  "encrypt-single-value": {
    example: "encrypt-single-value",
    contract: "contracts/encryption/EncryptSingleValue.sol",
    test: "test/encryption/EncryptSingleValue.ts",
    title: "Encrypt Single Value",
    category: "encryption",
    description: "Demonstrates the correct pattern for encrypting and storing a single encrypted value.",
  },
  "encrypt-multiple-values": {
    example: "encrypt-multiple-values",
    contract: "contracts/encryption/EncryptMultipleValues.sol",
    test: "test/encryption/EncryptMultipleValues.ts",
    title: "Encrypt Multiple Values",
    category: "encryption",
    description: "Shows how to handle multiple encrypted values in a single transaction with proper permission management.",
  },
  "user-decrypt-single": {
    example: "user-decrypt-single",
    contract: "contracts/decryption/UserDecryptSingleValue.sol",
    test: "test/decryption/UserDecryptSingleValue.ts",
    title: "User Decryption Single Value",
    category: "decryption",
    description: "Demonstrates user-side decryption of encrypted values through a relayer pattern.",
  },
  "public-decrypt-single": {
    example: "public-decrypt-single",
    contract: "contracts/decryption/PublicDecryptSingleValue.sol",
    test: "test/decryption/PublicDecryptSingleValue.ts",
    title: "Public Decryption Single Value",
    category: "decryption",
    description: "Shows public decryption where anyone can decrypt values with relayer support.",
  },
  "role-based-access": {
    example: "role-based-access",
    contract: "contracts/access-control/RoleBasedAccess.sol",
    test: "test/access-control/RoleBasedAccess.ts",
    title: "Role-Based Access Control",
    category: "access-control",
    description: "Implements encrypted role-based access control for membership systems.",
  },
  "common-pitfalls": {
    example: "common-pitfalls",
    contract: "contracts/antipatterns/CommonPitfalls.sol",
    test: "test/antipatterns/CommonPitfalls.ts",
    title: "Common Pitfalls and Solutions",
    category: "education",
    description: "Educational contract demonstrating common FHE mistakes and their correct solutions.",
  },
};

/// Read file contents
function readFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

/// Generate documentation for single example
function generateDocumentation(config: DocConfig): string {
  const contractContent = readFile(config.contract);
  const testContent = readFile(config.test);

  const doc = `# ${config.title}

## Overview

${config.description}

## Concepts Covered

This example demonstrates:
- Privacy preservation using FHEVM
- Encrypted data handling
- Zero-knowledge proofs
- Access control patterns
- FHE permission management

## Contract Implementation

\`\`\`solidity
${contractContent}
\`\`\`

## Test Suite

\`\`\`typescript
${testContent}
\`\`\`

## Key Patterns

### FHE Permissions
- \`FHE.allowThis(value)\` - Grant contract permission
- \`FHE.allow(value, user)\` - Grant user permission
- Both are required for proper operation

### Input Handling
- Use \`externalEuint32\` for external encrypted inputs
- Use \`FHE.fromExternal()\` with proof validation
- Always verify input proof binding

### Privacy Guarantees
- Encrypted values remain private
- Only authorized parties can decrypt
- Operations happen on encrypted data

## Learning Objectives

After reviewing this example, you should understand:
1. How to structure ${config.category} contracts
2. Best practices for encrypted value handling
3. Proper FHE permission management
4. Testing encrypted smart contracts

## Next Steps

- Review related examples in the ${config.category} category
- Try modifying the contract to add new functionality
- Implement similar patterns in your own contracts
- Test with the provided test suite

## References

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Guide](https://hardhat.org)
- [Solidity Documentation](https://docs.soliditylang.org)

---

**Category:** ${config.category}
**Difficulty:** ${getDifficulty(config.category)}
**Status:** Complete

Generated for Zama FHEVM Competition
`;

  return doc;
}

/// Get difficulty level for category
function getDifficulty(category: string): string {
  const difficulties: Record<string, string> = {
    basic: "Beginner",
    encryption: "Beginner",
    decryption: "Intermediate",
    "access-control": "Intermediate",
    education: "Intermediate",
  };
  return difficulties[category] || "Intermediate";
}

/// Generate SUMMARY.md (GitBook index)
function generateSummary(): string {
  const categories: Record<string, string[]> = {};

  for (const [key, config] of Object.entries(DOCS_CONFIG)) {
    if (!categories[config.category]) {
      categories[config.category] = [];
    }
    categories[config.category].push(key);
  }

  let summary = `# Summary

## Introduction

- [README](../README.md)
- [Quick Start](../QUICK_START.md)
- [Contributing](../CONTRIBUTING.md)

## Basic Examples

`;

  for (const example of categories["basic"] || []) {
    const config = DOCS_CONFIG[example];
    summary += `- [${config.title}](./${example}.md)\n`;
  }

  summary += `\n## Encryption Examples\n\n`;
  for (const example of categories["encryption"] || []) {
    const config = DOCS_CONFIG[example];
    summary += `- [${config.title}](./${example}.md)\n`;
  }

  summary += `\n## Decryption Examples\n\n`;
  for (const example of categories["decryption"] || []) {
    const config = DOCS_CONFIG[example];
    summary += `- [${config.title}](./${example}.md)\n`;
  }

  summary += `\n## Access Control\n\n`;
  for (const example of categories["access-control"] || []) {
    const config = DOCS_CONFIG[example];
    summary += `- [${config.title}](./${example}.md)\n`;
  }

  summary += `\n## Educational Examples\n\n`;
  for (const example of categories["education"] || []) {
    const config = DOCS_CONFIG[example];
    summary += `- [${config.title}](./${example}.md)\n`;
  }

  return summary;
}

/// Generate documentation for all examples
async function generateAllDocs(): Promise<void> {
  console.log("\n📚 Generating documentation for all examples...\n");

  const docsDir = path.resolve("docs");
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  for (const [key, config] of Object.entries(DOCS_CONFIG)) {
    const doc = generateDocumentation(config);
    const filePath = path.join(docsDir, `${key}.md`);
    fs.writeFileSync(filePath, doc);
    console.log(`✅ Generated: ${key}.md`);
  }

  // Generate SUMMARY.md
  const summary = generateSummary();
  fs.writeFileSync(path.join(docsDir, "SUMMARY.md"), summary);
  console.log(`✅ Generated: SUMMARY.md`);

  console.log(`\n✨ Documentation generated in: ${docsDir}`);
}

/// Generate docs for single example
async function generateSingleDoc(exampleName: string): Promise<void> {
  const config = DOCS_CONFIG[exampleName];

  if (!config) {
    console.error(`❌ Example "${exampleName}" not found`);
    console.log("\nAvailable examples:");
    listExamples();
    process.exit(1);
  }

  console.log(`\n📚 Generating documentation for: ${config.title}\n`);

  const docsDir = path.resolve("docs");
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const doc = generateDocumentation(config);
  const filePath = path.join(docsDir, `${exampleName}.md`);
  fs.writeFileSync(filePath, doc);

  console.log(`✅ Generated: ${exampleName}.md`);
  console.log(`📍 Path: ${filePath}`);
}

/// List all examples
function listExamples(): void {
  console.log("\n📋 Available Examples:\n");
  for (const [key, config] of Object.entries(DOCS_CONFIG)) {
    console.log(`  ${key}`);
    console.log(`    ${config.title}`);
    console.log(`    Category: ${config.category}\n`);
  }
}

/// Show help
function showHelp(): void {
  console.log(`
generate-docs.ts - Generate GitBook documentation

USAGE:
  ts-node scripts/generate-docs.ts <example-name>
  ts-node scripts/generate-docs.ts --all
  ts-node scripts/generate-docs.ts --list
  ts-node scripts/generate-docs.ts --help

EXAMPLES:
  # Generate docs for specific example
  ts-node scripts/generate-docs.ts basic-member

  # Generate all documentation
  ts-node scripts/generate-docs.ts --all

  # List available examples
  ts-node scripts/generate-docs.ts --list

OPTIONS:
  --all       Generate documentation for all examples
  --list      List all available examples
  --help      Show this help message

OUTPUT:
  Documentation is generated in the 'docs/' directory
  - SUMMARY.md - Navigation index
  - *.md - Individual example documentation
  `);
}

/// Main function
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help") {
    showHelp();
    process.exit(0);
  }

  if (args[0] === "--list") {
    listExamples();
    process.exit(0);
  }

  if (args[0] === "--all") {
    await generateAllDocs();
    process.exit(0);
  }

  const exampleName = args[0];
  await generateSingleDoc(exampleName);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
