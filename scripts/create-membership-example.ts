#!/usr/bin/env ts-node

/**
 * create-membership-example.ts
 * Generates standalone FHEVM membership example repositories
 *
 * Usage:
 *   ts-node scripts/create-membership-example.ts <example-name> <output-path>
 *   ts-node scripts/create-membership-example.ts --list
 *   ts-node scripts/create-membership-example.ts --help
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

/// Example configuration mapping
interface ExampleConfig {
  name: string;
  description: string;
  contract: string;
  test: string;
  category: string;
  tags: string[];
}

/// Map of all available examples
const EXAMPLES_MAP: Record<string, ExampleConfig> = {
  "basic-member": {
    name: "Basic Member Registration",
    description:
      "Simple membership registration with encrypted status. Demonstrates basic member management with privacy preservation.",
    contract: "contracts/basic/SimpleMembership.sol",
    test: "test/basic/SimpleMembership.ts",
    category: "basic",
    tags: ["membership", "registration", "encrypted-status"],
  },
  "fhe-arithmetic": {
    name: "FHE Arithmetic Operations",
    description:
      "Demonstrates FHE arithmetic operations (add, subtract, multiply) on encrypted data.",
    contract: "contracts/basic/FHEArithmetic.sol",
    test: "test/basic/FHEArithmetic.ts",
    category: "basic",
    tags: ["arithmetic", "add", "subtract", "multiply"],
  },
  "equality-comparison": {
    name: "Equality Comparison",
    description:
      "Shows how to compare encrypted values for equality without decryption.",
    contract: "contracts/basic/EqualityComparison.sol",
    test: "test/basic/EqualityComparison.ts",
    category: "basic",
    tags: ["comparison", "equality", "encrypted-comparison"],
  },
  "encrypt-single-value": {
    name: "Encrypt Single Value",
    description:
      "Demonstrates encrypting and storing a single encrypted value with proper FHE patterns.",
    contract: "contracts/encryption/EncryptSingleValue.sol",
    test: "test/encryption/EncryptSingleValue.ts",
    category: "encryption",
    tags: ["encryption", "single-value", "storage"],
  },
  "encrypt-multiple-values": {
    name: "Encrypt Multiple Values",
    description: "Shows how to handle multiple encrypted values in a single transaction.",
    contract: "contracts/encryption/EncryptMultipleValues.sol",
    test: "test/encryption/EncryptMultipleValues.ts",
    category: "encryption",
    tags: ["encryption", "multiple-values", "profile"],
  },
  "user-decrypt-single": {
    name: "User Decrypt Single Value",
    description: "Demonstrates user-side decryption of a single encrypted value via relayer.",
    contract: "contracts/decryption/UserDecryptSingleValue.sol",
    test: "test/decryption/UserDecryptSingleValue.ts",
    category: "decryption",
    tags: ["decryption", "user-decrypt", "relayer"],
  },
  "public-decrypt-single": {
    name: "Public Decrypt Single Value",
    description: "Shows public decryption where anyone can decrypt with relayer support.",
    contract: "contracts/decryption/PublicDecryptSingleValue.sol",
    test: "test/decryption/PublicDecryptSingleValue.ts",
    category: "decryption",
    tags: ["decryption", "public-decrypt", "transparency"],
  },
  "role-based-access": {
    name: "Role-Based Access Control",
    description: "Implements encrypted role-based access control for membership tiers.",
    contract: "contracts/access-control/RoleBasedAccess.sol",
    test: "test/access-control/RoleBasedAccess.ts",
    category: "access-control",
    tags: ["access-control", "roles", "permissions"],
  },
  "common-pitfalls": {
    name: "Common Pitfalls & Solutions",
    description: "Educational contract demonstrating common FHE mistakes and correct patterns.",
    contract: "contracts/antipatterns/CommonPitfalls.sol",
    test: "test/antipatterns/CommonPitfalls.ts",
    category: "education",
    tags: ["anti-patterns", "education", "best-practices"],
  },
};

/// Template for generated README
function generateReadmeTemplate(example: ExampleConfig): string {
  return `# ${example.name}

## Overview

${example.description}

## Quick Start

\`\`\`bash
npm install
npm run compile
npm run test
\`\`\

## Features

${example.tags.map((tag) => `- **${tag}**: ${tag.replace(/-/g, " ")}`).join("\n")}

## Contract

See \`contracts/\` for the contract implementation.

## Tests

Run tests with:

\`\`\`bash
npm run test
\`\`\`

## Documentation

- See contract NatSpec comments for implementation details
- Review test file for usage examples
- Check main README for FHEVM patterns

## Learning Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Guide](https://hardhat.org)
- [Main Project README](../README.md)

---

Generated for Zama FHEVM Competition
`;
}

/// Template for generated hardhat.config.ts
function generateHardhatConfig(): string {
  return `import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@fhevm/hardhat-plugin";
import "hardhat-deploy";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.MNEMONIC ? { mnemonic: process.env.MNEMONIC } : [],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
`;
}

/// Template for generated package.json
function generatePackageJson(example: ExampleConfig): string {
  return JSON.stringify(
    {
      name: `fhevm-example-${example.name.toLowerCase().replace(/ /g, "-")}`,
      version: "1.0.0",
      description: example.description,
      scripts: {
        compile: "hardhat compile",
        test: "hardhat test",
        "test:debug": "hardhat test --verbose",
      },
      dependencies: {},
      devDependencies: {
        "@fhevm/hardhat-plugin": "^0.3.0-1",
        "@fhevm/solidity": "^0.9.1",
        "@nomicfoundation/hardhat-toolbox": "^2.0.0",
        "@types/chai": "^4.3.11",
        "@types/mocha": "^10.0.6",
        "@types/node": "^20.10.6",
        chai: "^4.3.10",
        ethers: "^6.10.0",
        hardhat: "^2.21.0",
        "hardhat-deploy": "^0.11.46",
        typescript: "^5.3.3",
      },
      keywords: [
        "ethereum",
        "hardhat",
        "fhevm",
        "privacy",
        "homomorphic-encryption",
        example.category,
      ],
      author: "FHEVM Developer Community",
      license: "BSD-3-Clause-Clear",
    },
    null,
    2
  );
}

/// Create standalone example repository
async function createExample(exampleName: string, outputPath: string): Promise<void> {
  const example = EXAMPLES_MAP[exampleName];

  if (!example) {
    console.error(`❌ Example "${exampleName}" not found`);
    console.log("\nAvailable examples:");
    listExamples();
    process.exit(1);
  }

  console.log(`\n📦 Creating example: ${example.name}`);
  console.log(`   Output: ${outputPath}`);

  try {
    // Create output directory
    const outputDir = path.resolve(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create directory structure
    const dirs = ["contracts", "test", "deploy"];
    for (const dir of dirs) {
      const dirPath = path.join(outputDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }

    // Copy contract file
    const contractSrc = path.resolve(example.contract);
    const contractDir = path.dirname(example.contract);
    const contractFile = path.basename(example.contract);
    const contractDestDir = path.join(outputDir, "contracts", path.basename(contractDir));

    if (!fs.existsSync(contractDestDir)) {
      fs.mkdirSync(contractDestDir, { recursive: true });
    }

    if (fs.existsSync(contractSrc)) {
      fs.copyFileSync(contractSrc, path.join(contractDestDir, contractFile));
      console.log(`✅ Copied contract: ${contractFile}`);
    }

    // Copy test file
    const testSrc = path.resolve(example.test);
    const testDir = path.dirname(example.test);
    const testFile = path.basename(example.test);
    const testDestDir = path.join(outputDir, "test", path.basename(testDir));

    if (!fs.existsSync(testDestDir)) {
      fs.mkdirSync(testDestDir, { recursive: true });
    }

    if (fs.existsSync(testSrc)) {
      fs.copyFileSync(testSrc, path.join(testDestDir, testFile));
      console.log(`✅ Copied test: ${testFile}`);
    }

    // Generate configuration files
    fs.writeFileSync(path.join(outputDir, "hardhat.config.ts"), generateHardhatConfig());
    console.log("✅ Generated hardhat.config.ts");

    fs.writeFileSync(path.join(outputDir, "package.json"), generatePackageJson(example));
    console.log("✅ Generated package.json");

    // Generate README
    fs.writeFileSync(path.join(outputDir, "README.md"), generateReadmeTemplate(example));
    console.log("✅ Generated README.md");

    // Generate .gitignore
    const gitignore = `node_modules/
.env
.env.local
artifacts/
cache/
dist/
build/
.DS_Store
*.log
`;
    fs.writeFileSync(path.join(outputDir, ".gitignore"), gitignore);
    console.log("✅ Generated .gitignore");

    // Generate tsconfig.json
    const tsconfig = {
      compilerOptions: {
        target: "ES2020",
        module: "commonjs",
        lib: ["ES2020"],
        outDir: "./dist",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
      },
      include: ["hardhat.config.ts", "test/**/*"],
      exclude: ["node_modules"],
    };
    fs.writeFileSync(path.join(outputDir, "tsconfig.json"), JSON.stringify(tsconfig, null, 2));
    console.log("✅ Generated tsconfig.json");

    console.log(`\n✨ Successfully created: ${outputPath}`);
    console.log("\nNext steps:");
    console.log(`  cd ${outputPath}`);
    console.log("  npm install");
    console.log("  npm run compile");
    console.log("  npm run test");
  } catch (error) {
    console.error(`❌ Error creating example:`, error);
    process.exit(1);
  }
}

/// List all available examples
function listExamples(): void {
  console.log("\n📋 Available Examples:\n");
  for (const [key, example] of Object.entries(EXAMPLES_MAP)) {
    console.log(`  ${key}`);
    console.log(`    ${example.name}`);
    console.log(`    Category: ${example.category}`);
    console.log(`    Tags: ${example.tags.join(", ")}\n`);
  }
}

/// Show help message
function showHelp(): void {
  console.log(`
create-membership-example.ts - Generate standalone FHEVM examples

USAGE:
  ts-node scripts/create-membership-example.ts <example-name> <output-path>
  ts-node scripts/create-membership-example.ts --list
  ts-node scripts/create-membership-example.ts --help

EXAMPLES:
  # Create a single example
  ts-node scripts/create-membership-example.ts basic-member ./output/basic-member

  # List all examples
  ts-node scripts/create-membership-example.ts --list

  # Show this help message
  ts-node scripts/create-membership-example.ts --help

OPTIONS:
  --list    Show all available examples
  --help    Show this help message

CATEGORIES:
  basic              - Basic membership operations
  encryption         - Encryption examples
  decryption         - Decryption patterns
  access-control     - Access control examples
  education          - Educational examples
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

  if (args.length < 2) {
    console.error("❌ Error: example name and output path required");
    showHelp();
    process.exit(1);
  }

  const exampleName = args[0];
  const outputPath = args[1];

  await createExample(exampleName, outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
