const hre = require("hardhat");
const fs  = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying LandRegistry with account:", deployer.address);

  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const registry = await LandRegistry.deploy();
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  console.log("LandRegistry deployed to:", contractAddress);

  // ── Write the ABI + address to a shared file that the Flask backend reads ──
  const artifact = hre.artifacts.readArtifactSync("LandRegistry");

  const outputDir  = path.join(__dirname, "..", "..", "backend", "blockchain_artifacts");
  const outputFile = path.join(outputDir, "LandRegistry.json");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const output = {
    address: contractAddress,
    abi:     artifact.abi,
  };

  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
  console.log("ABI + address written to:", outputFile);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
