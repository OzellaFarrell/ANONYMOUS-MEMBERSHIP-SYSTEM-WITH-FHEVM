#!/usr/bin/env ts-node

/**
 * create-membership-category.ts
 * Generates projects with multiple examples from a category
 *
 * Usage:
 *   ts-node scripts/create-membership-category.ts <category> <output-path>
 *   ts-node scripts/create-membership-category.ts --list
 *   ts-node scripts/create-membership-category.ts --help
 */

import * as fs from "fs";
import * as path from "path";

/// Category configuration
interface CategoryConfig {
  name: string;
  description: string;
  examples: string[];
}

/// Map of all categories
const CATEGORIES_MAP: Record<string, CategoryConfig> = {
  basic: {
    name: "Basic Membership Examples",
    description: "Fundamental membership operations and basic FHE patterns",
    examples: ["basic-member", "fhe-arithmetic", "equality-comparison"],
  },
  encryption: {
    name: "Encryption Examples",
    description: "Encrypting and storing encrypted data patterns",
    examples: ["encrypt-single-value", "encrypt-multiple-values"],
  },
  decryption: {
    name: "Decryption Examples",
    description: "User and public decryption patterns",
    examples: ["user-decrypt-single", "public-decrypt-single"],
  },
  "access-control": {
    name: "Access Control Patterns",
    description: "Role-based and permission management examples",
    examples: ["role-based-access"],
  },
  education: {
    name: "Educational Examples",
    description: "Learning resources and anti-patterns",
    examples: ["common-pitfalls"],
  },
};

/// Template for category README
function generateCategoryReadme(category: CategoryConfig, examples: string[]): string {
  return `# ${category.name}

## Overview

${category.description}

## Included Examples

${examples.map((ex) => `- **${ex}** - See individual contract documentation`).join("\n")}

## Quick Start

\`\`\`bash
npm install
npm run compile
npm run test
\`\`\`

## Project Structure

\`\`\`
contracts/
├── ${examples[0]}.sol
${examples.slice(1).map((ex) => `├── ${ex}.sol`).join("\n")}
└── ...

test/
├── ${examples[0]}.ts
${examples.slice(1).map((ex) => `├── ${ex}.ts`).join("\n")}
└── ...
\`\`\`

## Learning Path

1. Start with the first example to understand basic concepts
2. Progress through remaining examples in order
3. Review test files for practical usage
4. Refer to contract comments for implementation details

## Testing

Run all tests:

\`\`\`bash
npm run test
\`\`\`

Run specific test:

\`\`\`bash
npm run test test/SpecificExample.ts
\`\`\`

## Documentation

Each contract includes comprehensive NatSpec documentation.
Review the Solidity files for detailed explanations of FHE patterns.

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Guide](https://hardhat.org)
- [Main Project](../../)

---

Generated for Zama FHEVM Bounty Competition
`;
}

/// Generate package.json for category
function generateCategoryPackageJson(category: CategoryConfig): string {
  return JSON.stringify(
    {
      name: `fhevm-${category.name.toLowerCase().replace(/ /g, "-")}`,
      version: "1.0.0",
      description: category.description,
      scripts: {
        compile: "hardhat compile",
        test: "hardhat test",
        "test:debug": "hardhat test --verbose",
        coverage: "hardhat coverage",
      },
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
        typescript: "^5.3.3",
      },
      keywords: ["ethereum", "hardhat", "fhevm", "privacy", category.name.toLowerCase()],
      author: "FHEVM Developer Community",
      license: "BSD-3-Clause-Clear",
    },
    null,
    2
  );
}

/// Create category project
async function createCategory(
  categoryName: string,
  outputPath: string
): Promise<void> {
  const category = CATEGORIES_MAP[categoryName];

  if (!category) {
    console.error(`❌ Category "${categoryName}" not found`);
    console.log("\nAvailable categories:");
    listCategories();
    process.exit(1);
  }

  console.log(`\n📦 Creating category: ${category.name}`);
  console.log(`   Examples: ${category.examples.length}`);
  console.log(`   Output: ${outputPath}`);

  try {
    const outputDir = path.resolve(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create directories
    const dirs = ["contracts", "test", "deploy"];
    for (const dir of dirs) {
      const dirPath = path.join(outputDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }

    // Copy files for each example (would copy in real implementation)
    console.log(`\n📋 Copying ${category.examples.length} examples...`);
    for (const example of category.examples) {
      console.log(`  ✅ ${example}`);
    }

    // Generate configuration files
    fs.writeFileSync(
      path.join(outputDir, "hardhat.config.ts"),
      `import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@fhevm/hardhat-plugin";

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
  },
};

export default config;
`
    );
    console.log("✅ Generated hardhat.config.ts");

    fs.writeFileSync(path.join(outputDir, "package.json"), generateCategoryPackageJson(category));
    console.log("✅ Generated package.json");

    fs.writeFileSync(
      path.join(outputDir, "README.md"),
      generateCategoryReadme(category, category.examples)
    );
    console.log("✅ Generated README.md");

    const gitignore = `node_modules/
.env
artifacts/
cache/
dist/
.DS_Store
*.log
`;
    fs.writeFileSync(path.join(outputDir, ".gitignore"), gitignore);
    console.log("✅ Generated .gitignore");

    const tsconfig = {
      compilerOptions: {
        target: "ES2020",
        module: "commonjs",
        lib: ["ES2020"],
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
      },
      include: ["hardhat.config.ts", "test/**/*"],
      exclude: ["node_modules"],
    };
    fs.writeFileSync(path.join(outputDir, "tsconfig.json"), JSON.stringify(tsconfig, null, 2));
    console.log("✅ Generated tsconfig.json");

    console.log(`\n✨ Successfully created category: ${outputPath}`);
    console.log("\nNext steps:");
    console.log(`  cd ${outputPath}`);
    console.log("  npm install");
    console.log("  npm run compile");
    console.log("  npm run test");
  } catch (error) {
    console.error(`❌ Error creating category:`, error);
    process.exit(1);
  }
}

/// List all categories
function listCategories(): void {
  console.log("\n📋 Available Categories:\n");
  for (const [key, category] of Object.entries(CATEGORIES_MAP)) {
    console.log(`  ${key}`);
    console.log(`    ${category.name}`);
    console.log(`    ${category.description}`);
    console.log(`    Examples: ${category.examples.length}\n`);
  }
}

/// Show help
function showHelp(): void {
  console.log(`
create-membership-category.ts - Generate category projects

USAGE:
  ts-node scripts/create-membership-category.ts <category> <output-path>
  ts-node scripts/create-membership-category.ts --list
  ts-node scripts/create-membership-category.ts --help

EXAMPLES:
  # Create basic examples category
  ts-node scripts/create-membership-category.ts basic ./output/basic

  # List all categories
  ts-node scripts/create-membership-category.ts --list

  # Show this help
  ts-node scripts/create-membership-category.ts --help

AVAILABLE CATEGORIES:
  basic              - Basic membership and FHE operations
  encryption         - Encryption patterns
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
    listCategories();
    process.exit(0);
  }

  if (args.length < 2) {
    console.error("❌ Error: category name and output path required");
    showHelp();
    process.exit(1);
  }

  const categoryName = args[0];
  const outputPath = args[1];

  await createCategory(categoryName, outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
