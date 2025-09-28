import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * Tutorial: Deploy and Interact with VotingSystem
 * ===============================================
 *
 * 1. From a separate terminal window:
 *    npx hardhat node
 *
 * 2. Deploy the VotingSystem contract:
 *    npx hardhat --network localhost deploy --tags VotingSystem
 *
 * 3. Interact with the VotingSystem contract:
 *    npx hardhat --network localhost task:voting-address
 *    npx hardhat --network localhost task:create-voting --title "Test Vote" --description "A test voting" --options "Option A,Option B,Option C" --duration 3600 --public true
 *    npx hardhat --network localhost task:vote --voting-id 0 --option 1
 *    npx hardhat --network localhost task:get-voting-info --voting-id 0
 */

/**
 * Get VotingSystem contract address
 */
task("task:voting-address", "Prints the VotingSystem address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;
  const votingSystem = await deployments.get("VotingSystem");
  console.log("VotingSystem address is " + votingSystem.address);
});

/**
 * Create a new voting
 */
task("task:create-voting", "Creates a new voting")
  .addParam("title", "Voting title")
  .addParam("description", "Voting description")
  .addParam("options", "Comma-separated voting options (2-4 options)")
  .addOptionalParam("duration", "Voting duration in seconds", "3600")
  .addOptionalParam("public", "Is public voting (true/false)", "true")
  .addOptionalParam("address", "VotingSystem contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const votingSystemDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("VotingSystem");

    console.log(`VotingSystem: ${votingSystemDeployment.address}`);

    const signers = await ethers.getSigners();
    const votingSystemContract = await ethers.getContractAt("VotingSystem", votingSystemDeployment.address);

    const options = taskArguments.options.split(",").map((opt: string) => opt.trim());
    if (options.length < 2 || options.length > 4) {
      throw new Error("Must provide 2-4 options");
    }

    const duration = parseInt(taskArguments.duration);
    const startTime = Math.floor(Date.now() / 1000);
    const endTime = startTime + duration;
    const isPublic = taskArguments.public === "true";

    console.log("Creating voting with parameters:");
    console.log("- Title:", taskArguments.title);
    console.log("- Description:", taskArguments.description);
    console.log("- Options:", options);
    console.log("- Start time:", new Date(startTime * 1000).toISOString());
    console.log("- End time:", new Date(endTime * 1000).toISOString());
    console.log("- Is public:", isPublic);

    const tx = await votingSystemContract
      .connect(signers[0])
      .createVoting(
        taskArguments.title,
        taskArguments.description,
        options,
        startTime,
        endTime,
        isPublic
      );

    console.log(`Transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block: ${receipt?.blockNumber}`);

    // Get the voting ID from events
    const events = receipt?.logs || [];
    for (const event of events) {
      try {
        const parsedEvent = votingSystemContract.interface.parseLog(event);
        if (parsedEvent?.name === "VotingCreated") {
          console.log(`Voting created with ID: ${parsedEvent.args.votingId}`);
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  });

/**
 * Cast a vote
 */
task("task:vote", "Cast a vote in a voting")
  .addParam("votingId", "Voting ID")
  .addParam("option", "Option index (0-based)")
  .addOptionalParam("address", "VotingSystem contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const votingSystemDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("VotingSystem");

    console.log(`VotingSystem: ${votingSystemDeployment.address}`);

    const signers = await ethers.getSigners();
    const votingSystemContract = await ethers.getContractAt("VotingSystem", votingSystemDeployment.address);

    const votingId = parseInt(taskArguments.votingId);
    const optionIndex = parseInt(taskArguments.option);

    console.log(`Casting vote for voting ${votingId}, option ${optionIndex}`);

    // Encrypt the option index
    const encryptedOption = await fhevm
      .createEncryptedInput(votingSystemDeployment.address, signers[0].address)
      .add8(optionIndex)
      .encrypt();

    const tx = await votingSystemContract
      .connect(signers[0])
      .vote(votingId, encryptedOption.handles[0], encryptedOption.inputProof);

    console.log(`Transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Vote cast successfully in block: ${receipt?.blockNumber}`);
  });

/**
 * Get voting information
 */
task("task:get-voting-info", "Get voting information")
  .addParam("votingId", "Voting ID")
  .addOptionalParam("address", "VotingSystem contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const votingSystemDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("VotingSystem");

    console.log(`VotingSystem: ${votingSystemDeployment.address}`);

    const votingSystemContract = await ethers.getContractAt("VotingSystem", votingSystemDeployment.address);
    const votingId = parseInt(taskArguments.votingId);

    const votingInfo = await votingSystemContract.getVotingInfo(votingId);

    console.log("Voting Information:");
    console.log("- ID:", votingId);
    console.log("- Title:", votingInfo.title);
    console.log("- Description:", votingInfo.description);
    console.log("- Options:", votingInfo.options);
    console.log("- Creator:", votingInfo.creator);
    console.log("- Start time:", new Date(Number(votingInfo.startTime) * 1000).toISOString());
    console.log("- End time:", new Date(Number(votingInfo.endTime) * 1000).toISOString());
    console.log("- Is active:", votingInfo.isActive);
    console.log("- Is public:", votingInfo.isPublic);
    console.log("- Total votes:", votingInfo.totalVotes.toString());
  });

/**
 * End a voting
 */
task("task:end-voting", "End a voting")
  .addParam("votingId", "Voting ID")
  .addOptionalParam("address", "VotingSystem contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const votingSystemDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("VotingSystem");

    console.log(`VotingSystem: ${votingSystemDeployment.address}`);

    const signers = await ethers.getSigners();
    const votingSystemContract = await ethers.getContractAt("VotingSystem", votingSystemDeployment.address);

    const votingId = parseInt(taskArguments.votingId);

    console.log(`Ending voting ${votingId}`);

    const tx = await votingSystemContract.connect(signers[0]).endVoting(votingId);

    console.log(`Transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Voting ended successfully in block: ${receipt?.blockNumber}`);
  });

/**
 * Get encrypted vote counts
 */
task("task:get-encrypted-counts", "Get encrypted vote counts for a voting")
  .addParam("votingId", "Voting ID")
  .addOptionalParam("address", "VotingSystem contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const votingSystemDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("VotingSystem");

    console.log(`VotingSystem: ${votingSystemDeployment.address}`);

    const signers = await ethers.getSigners();
    const votingSystemContract = await ethers.getContractAt("VotingSystem", votingSystemDeployment.address);

    const votingId = parseInt(taskArguments.votingId);

    // Get voting info to know how many options there are
    const votingInfo = await votingSystemContract.getVotingInfo(votingId);
    const optionsCount = votingInfo.options.length;

    console.log(`Getting encrypted vote counts for voting ${votingId}:`);

    for (let i = 0; i < optionsCount; i++) {
      const encryptedCount = await votingSystemContract.getEncryptedVoteCount(votingId, i);
      
      if (encryptedCount !== ethers.ZeroHash) {
        try {
          const decryptedCount = await fhevm.userDecryptEuint(
            FhevmType.euint32,
            encryptedCount,
            votingSystemDeployment.address,
            signers[0]
          );
          console.log(`- Option ${i} (${votingInfo.options[i]}): ${decryptedCount} votes`);
        } catch (error) {
          console.log(`- Option ${i} (${votingInfo.options[i]}): Encrypted count = ${encryptedCount}`);
        }
      } else {
        console.log(`- Option ${i} (${votingInfo.options[i]}): 0 votes`);
      }
    }
  });

/**
 * Make voting results publicly decryptable
 */
task("task:make-results-public", "Make voting results publicly decryptable")
  .addParam("votingId", "Voting ID")
  .addOptionalParam("address", "VotingSystem contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const votingSystemDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("VotingSystem");

    console.log(`VotingSystem: ${votingSystemDeployment.address}`);

    const signers = await ethers.getSigners();
    const votingSystemContract = await ethers.getContractAt("VotingSystem", votingSystemDeployment.address);

    const votingId = parseInt(taskArguments.votingId);

    console.log(`Making results public for voting ${votingId}`);

    const tx = await votingSystemContract.connect(signers[0]).makeResultsPublic(votingId);

    console.log(`Transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Results made public successfully in block: ${receipt?.blockNumber}`);
  });

/**
 * Add addresses to whitelist
 */
task("task:add-whitelist", "Add addresses to voting whitelist")
  .addParam("votingId", "Voting ID")
  .addParam("addresses", "Comma-separated addresses to whitelist")
  .addOptionalParam("address", "VotingSystem contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const votingSystemDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("VotingSystem");

    console.log(`VotingSystem: ${votingSystemDeployment.address}`);

    const signers = await ethers.getSigners();
    const votingSystemContract = await ethers.getContractAt("VotingSystem", votingSystemDeployment.address);

    const votingId = parseInt(taskArguments.votingId);
    const addresses = taskArguments.addresses.split(",").map((addr: string) => addr.trim());

    console.log(`Adding addresses to whitelist for voting ${votingId}:`, addresses);

    const tx = await votingSystemContract.connect(signers[0]).addToWhitelist(votingId, addresses);

    console.log(`Transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Addresses added to whitelist successfully in block: ${receipt?.blockNumber}`);
  });
