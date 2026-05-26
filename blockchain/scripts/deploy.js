const hre = require("hardhat");

async function main() {
  const signers = await hre.ethers.getSigners();
  const deployer = signers[1]; // Use Account #1 to get a different address

  console.log("Deploying with account:", deployer.address);

  const CertificateStorage = await hre.ethers.getContractFactory("CertificateStorage", deployer);
  const certificateStorage = await CertificateStorage.deploy();

  await certificateStorage.waitForDeployment();

  console.log("CertificateStorage deployed to:", await certificateStorage.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
