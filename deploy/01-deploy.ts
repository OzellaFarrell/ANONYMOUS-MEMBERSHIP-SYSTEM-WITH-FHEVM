import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploy script for Anonymous Membership contracts
 *
 * This script deploys all membership contracts to the configured network
 * It handles contract initialization and verification setup
 */
const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("\n🚀 Deploying Anonymous Membership System to", network.name);
  console.log("📍 Deployer:", deployer);

  // Deploy SimpleMembership
  console.log("\n📦 Deploying SimpleMembership...");
  const simpleMembership = await deploy("SimpleMembership", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });
  console.log("✅ SimpleMembership deployed at:", simpleMembership.address);

  // Deploy FHEArithmetic
  console.log("\n📦 Deploying FHEArithmetic...");
  const fheArithmetic = await deploy("FHEArithmetic", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });
  console.log("✅ FHEArithmetic deployed at:", fheArithmetic.address);

  // Deploy EqualityComparison
  console.log("\n📦 Deploying EqualityComparison...");
  try {
    const equalityComparison = await deploy("EqualityComparison", {
      from: deployer,
      args: [],
      log: true,
      waitConfirmations: 1,
    });
    console.log("✅ EqualityComparison deployed at:", equalityComparison.address);
  } catch (error) {
    console.log("⚠️  EqualityComparison deployment skipped (requires encrypted constructor input)");
  }

  // Deploy EncryptSingleValue
  console.log("\n📦 Deploying EncryptSingleValue...");
  const encryptSingleValue = await deploy("EncryptSingleValue", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });
  console.log("✅ EncryptSingleValue deployed at:", encryptSingleValue.address);

  // Deploy EncryptMultipleValues
  console.log("\n📦 Deploying EncryptMultipleValues...");
  const encryptMultipleValues = await deploy("EncryptMultipleValues", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });
  console.log("✅ EncryptMultipleValues deployed at:", encryptMultipleValues.address);

  // Deploy UserDecryptSingleValue
  console.log("\n📦 Deploying UserDecryptSingleValue...");
  const userDecryptSingle = await deploy("UserDecryptSingleValue", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });
  console.log("✅ UserDecryptSingleValue deployed at:", userDecryptSingle.address);

  // Deploy PublicDecryptSingleValue
  console.log("\n📦 Deploying PublicDecryptSingleValue...");
  const publicDecryptSingle = await deploy("PublicDecryptSingleValue", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });
  console.log("✅ PublicDecryptSingleValue deployed at:", publicDecryptSingle.address);

  // Deploy RoleBasedAccess
  console.log("\n📦 Deploying RoleBasedAccess...");
  const roleBasedAccess = await deploy("RoleBasedAccess", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });
  console.log("✅ RoleBasedAccess deployed at:", roleBasedAccess.address);

  // Deploy CommonPitfalls
  console.log("\n📦 Deploying CommonPitfalls...");
  const commonPitfalls = await deploy("CommonPitfalls", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });
  console.log("✅ CommonPitfalls deployed at:", commonPitfalls.address);

  // Print deployment summary
  console.log("\n\n📋 Deployment Summary");
  console.log("═".repeat(50));
  console.log(`Network:                    ${network.name}`);
  console.log(`Deployer:                   ${deployer}`);
  console.log("\n📦 Deployed Contracts:");
  console.log(`  1. SimpleMembership:      ${simpleMembership.address}`);
  console.log(`  2. FHEArithmetic:         ${fheArithmetic.address}`);
  console.log(`  3. EncryptSingleValue:    ${encryptSingleValue.address}`);
  console.log(`  4. EncryptMultipleValues: ${encryptMultipleValues.address}`);
  console.log(`  5. UserDecryptSingleValue: ${userDecryptSingle.address}`);
  console.log(`  6. PublicDecryptSingleValue: ${publicDecryptSingle.address}`);
  console.log(`  7. RoleBasedAccess:       ${roleBasedAccess.address}`);
  console.log(`  8. CommonPitfalls:        ${commonPitfalls.address}`);
  console.log("═".repeat(50));

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    deployer: deployer,
    timestamp: new Date().toISOString(),
    contracts: {
      SimpleMembership: simpleMembership.address,
      FHEArithmetic: fheArithmetic.address,
      EncryptSingleValue: encryptSingleValue.address,
      EncryptMultipleValues: encryptMultipleValues.address,
      UserDecryptSingleValue: userDecryptSingle.address,
      PublicDecryptSingleValue: publicDecryptSingle.address,
      RoleBasedAccess: roleBasedAccess.address,
      CommonPitfalls: commonPitfalls.address,
    },
  };

  const fs = require("fs");
  fs.writeFileSync(
    `./deployments/${network.name}-deployment.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n✅ Deployment info saved to:", `./deployments/${network.name}-deployment.json`);
};

deploy.tags = ["all"];
export default deploy;
