import { ethers } from "ethers";
import fs from "fs";

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  
  // Use Account #0 private key
  const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("Deploying from account:", wallet.address);

  // Read artifact
  const artifactRaw = fs.readFileSync("../frontend/src/artifacts/contracts/CertificateStorage.sol/CertificateStorage.json", "utf8");
  const artifact = JSON.parse(artifactRaw);

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy();

  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("CertificateStorage deployed to:", address);
}

main().catch(console.error);
