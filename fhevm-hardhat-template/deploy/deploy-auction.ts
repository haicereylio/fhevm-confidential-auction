import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log(`Deploying ConfidentialAuction to ${network.name}...`);
  console.log(`Deployer: ${deployer}`);

  const confidentialAuction = await deploy("ConfidentialAuction", {
    from: deployer,
    args: [], // Constructor has no arguments
    log: true,
    autoMine: true, // Speed up deployment on local network
    waitConfirmations: network.name === "hardhat" ? 1 : 6,
  });

  console.log(`ConfidentialAuction deployed to: ${confidentialAuction.address}`);

  // Verify contract on Etherscan (if not local network)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

    try {
      console.log("Verifying contract on Etherscan...");
      await hre.run("verify:verify", {
        address: confidentialAuction.address,
        constructorArguments: [],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.log("Verification failed:", error);
    }
  }

  // Post-deployment setup for non-hardhat networks
  if (network.name !== "hardhat") {
    console.log("Setting up initial configuration...");
    
    const contract = await hre.ethers.getContractAt("ConfidentialAuction", confidentialAuction.address);
    
    // You can add initial setup here, such as:
    // - Setting additional auctioneers
    // - Configuring platform fees
    // - Creating initial test auctions
    
    console.log("Initial configuration completed!");
  }

  return true;
};

func.tags = ["ConfidentialAuction"];
func.dependencies = []; // No dependencies
func.id = "deploy_confidential_auction"; // Add required id field

export default func;

