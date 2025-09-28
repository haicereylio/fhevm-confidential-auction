import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  console.log("Deploying VotingSystem with account:", deployer);

  const votingSystem = await deploy("VotingSystem", {
    from: deployer,
    args: [], // Constructor has no arguments
    log: true,
    waitConfirmations: 1,
  });

  console.log("VotingSystem deployed to:", votingSystem.address);
  console.log("Transaction hash:", votingSystem.transactionHash);

  // Verify contract on Etherscan if not on localhost
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds

    try {
      await hre.run("verify:verify", {
        address: votingSystem.address,
        constructorArguments: [],
      });
      console.log("Contract verified on Etherscan");
    } catch (error) {
      console.log("Verification failed:", error);
    }
  }
};

func.tags = ["VotingSystem"];
func.dependencies = []; // No dependencies
func.id = "deploy_voting_system"; // Add required id field

export default func;
