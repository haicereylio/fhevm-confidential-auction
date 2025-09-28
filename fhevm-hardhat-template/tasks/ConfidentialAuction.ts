import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * Create a new auction
 */
task("auction:create", "Create a new auction")
  .addParam("title", "Auction title")
  .addParam("description", "Item description")
  .addOptionalParam("imageurl", "Item image URL", "")
  .addOptionalParam("type", "Auction type (0=ENGLISH, 1=DUTCH, 2=SEALED_BID, 3=RESERVE)", "0")
  .addOptionalParam("start", "Start time (timestamp)", (Math.floor(Date.now() / 1000) + 300).toString())
  .addOptionalParam("end", "End time (timestamp)", (Math.floor(Date.now() / 1000) + 3600).toString())
  .addOptionalParam("increment", "Minimum bid increment in ETH", "0.01")
  .addOptionalParam("extension", "Extension time in seconds", "300")
  .addOptionalParam("reserve", "Reserve price in ETH (0 for no reserve)", "0")
  .addOptionalParam("address", "ConfidentialAuction contract address")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments, fhevm }) {
    const { title, description, imageurl, type, start, end, increment, extension, reserve, address } = taskArguments;
    
    await fhevm.initializeCLIApi();

    const auctionDeployment = address
      ? { address: address }
      : await deployments.get("ConfidentialAuction");

    console.log(`ConfidentialAuction: ${auctionDeployment.address}`);

    const signers = await ethers.getSigners();
    const auctionContract = await ethers.getContractAt("ConfidentialAuction", auctionDeployment.address);

    const auctionType = parseInt(type);
    const startTime = parseInt(start);
    const endTime = parseInt(end);
    const minimumBidIncrement = ethers.parseEther(increment);
    const extensionTime = parseInt(extension);
    const hasReservePrice = parseFloat(reserve) > 0;

    console.log(`Creating auction: ${title}`);
    console.log(`Type: ${["ENGLISH", "DUTCH", "SEALED_BID", "RESERVE"][auctionType]}`);
    console.log(`Duration: ${new Date(startTime * 1000)} to ${new Date(endTime * 1000)}`);

    let tx;
    if (hasReservePrice) {
      // Encrypt reserve price
      const reservePriceWei = ethers.parseEther(reserve);
      const encryptedReserve = await fhevm
        .createEncryptedInput(auctionDeployment.address, signers[0].address)
        .add64(reservePriceWei)
        .encrypt();

      tx = await auctionContract
        .connect(signers[0])
        .createAuction(
          title,
          description,
          imageurl,
          auctionType,
          startTime,
          endTime,
          minimumBidIncrement,
          extensionTime,
          hasReservePrice,
          encryptedReserve.handles[0],
          encryptedReserve.inputProof
        );
    } else {
      // No reserve price
      tx = await auctionContract
        .connect(signers[0])
        .createAuction(
          title,
          description,
          imageurl,
          auctionType,
          startTime,
          endTime,
          minimumBidIncrement,
          extensionTime,
          false,
          0, // dummy encrypted value
          "0x" // empty proof
        );
    }

    console.log(`Transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Auction created successfully in block: ${receipt?.blockNumber}`);
  });

/**
 * Place a bid
 */
task("auction:bid", "Place a bid in an auction")
  .addParam("auctionid", "Auction ID")
  .addParam("amount", "Bid amount in ETH")
  .addOptionalParam("address", "ConfidentialAuction contract address")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments, fhevm }) {
    const { auctionid, amount, address } = taskArguments;
    
    await fhevm.initializeCLIApi();

    const auctionDeployment = address
      ? { address: address }
      : await deployments.get("ConfidentialAuction");

    console.log(`ConfidentialAuction: ${auctionDeployment.address}`);

    const signers = await ethers.getSigners();
    const auctionContract = await ethers.getContractAt("ConfidentialAuction", auctionDeployment.address);

    const auctionId = parseInt(auctionid);
    const bidAmountWei = ethers.parseEther(amount);

    console.log(`Placing bid for auction ${auctionId}: ${amount} ETH`);

    // Encrypt the bid amount
    const encryptedBid = await fhevm
      .createEncryptedInput(auctionDeployment.address, signers[0].address)
      .add64(bidAmountWei)
      .encrypt();

    const tx = await auctionContract
      .connect(signers[0])
      .placeBid(auctionId, encryptedBid.handles[0], encryptedBid.inputProof);

    console.log(`Transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Bid placed successfully in block: ${receipt?.blockNumber}`);
  });

/**
 * Set auto-bid
 */
task("auction:auto-bid", "Set up auto-bidding")
  .addParam("auctionid", "Auction ID")
  .addParam("maxamount", "Maximum bid amount in ETH")
  .addOptionalParam("address", "ConfidentialAuction contract address")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments, fhevm }) {
    const { auctionid, maxamount, address } = taskArguments;
    
    await fhevm.initializeCLIApi();

    const auctionDeployment = address
      ? { address: address }
      : await deployments.get("ConfidentialAuction");

    console.log(`ConfidentialAuction: ${auctionDeployment.address}`);

    const signers = await ethers.getSigners();
    const auctionContract = await ethers.getContractAt("ConfidentialAuction", auctionDeployment.address);

    const auctionId = parseInt(auctionid);
    const maxBidAmountWei = ethers.parseEther(maxamount);

    console.log(`Setting auto-bid for auction ${auctionId}: max ${maxamount} ETH`);

    // Encrypt the maximum bid amount
    const encryptedMaxBid = await fhevm
      .createEncryptedInput(auctionDeployment.address, signers[0].address)
      .add64(maxBidAmountWei)
      .encrypt();

    const tx = await auctionContract
      .connect(signers[0])
      .setAutoBid(auctionId, encryptedMaxBid.handles[0], encryptedMaxBid.inputProof);

    console.log(`Transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Auto-bid set successfully in block: ${receipt?.blockNumber}`);
  });

/**
 * List all auctions
 */
task("auction:list", "List all auctions")
  .addOptionalParam("address", "ConfidentialAuction contract address")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    const { address } = taskArguments;

    const auctionDeployment = address
      ? { address: address }
      : await deployments.get("ConfidentialAuction");

    console.log(`ConfidentialAuction: ${auctionDeployment.address}`);

    const auctionContract = await ethers.getContractAt("ConfidentialAuction", auctionDeployment.address);

    const totalAuctions = await auctionContract.getTotalAuctions();
    console.log(`Total auctions: ${totalAuctions}`);

    for (let i = 0; i < totalAuctions; i++) {
      const auction = await auctionContract.getAuctionInfo(i);
      const isEnded = await auctionContract.isAuctionEnded(i);
      
      console.log(`\nAuction ${i}:`);
      console.log(`  Title: ${auction.title}`);
      console.log(`  Description: ${auction.description}`);
      console.log(`  Creator: ${auction.creator}`);
      console.log(`  Type: ${["ENGLISH", "DUTCH", "SEALED_BID", "RESERVE"][auction.auctionType]}`);
      console.log(`  Status: ${["PENDING", "ACTIVE", "EXTENDED", "ENDED", "CANCELLED"][auction.status]}`);
      console.log(`  Start: ${new Date(Number(auction.startTime) * 1000)}`);
      console.log(`  End: ${new Date(Number(auction.endTime) * 1000)}`);
      console.log(`  Total Bids: ${auction.totalBids}`);
      console.log(`  Has Reserve: ${auction.hasReservePrice}`);
      console.log(`  Is Ended: ${isEnded}`);
    }
  });

/**
 * End an auction
 */
task("auction:end", "End an auction")
  .addParam("auctionid", "Auction ID")
  .addOptionalParam("address", "ConfidentialAuction contract address")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    const { auctionid, address } = taskArguments;

    const auctionDeployment = address
      ? { address: address }
      : await deployments.get("ConfidentialAuction");

    console.log(`ConfidentialAuction: ${auctionDeployment.address}`);

    const signers = await ethers.getSigners();
    const auctionContract = await ethers.getContractAt("ConfidentialAuction", auctionDeployment.address);

    const auctionId = parseInt(auctionid);

    console.log(`Ending auction ${auctionId}`);

    const tx = await auctionContract
      .connect(signers[0])
      .endAuction(auctionId);

    console.log(`Transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Auction ended successfully in block: ${receipt?.blockNumber}`);
  });

/**
 * Reveal auction results
 */
task("auction:reveal", "Reveal auction results")
  .addParam("auctionid", "Auction ID")
  .addOptionalParam("address", "ConfidentialAuction contract address")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    const { auctionid, address } = taskArguments;

    const auctionDeployment = address
      ? { address: address }
      : await deployments.get("ConfidentialAuction");

    console.log(`ConfidentialAuction: ${auctionDeployment.address}`);

    const signers = await ethers.getSigners();
    const auctionContract = await ethers.getContractAt("ConfidentialAuction", auctionDeployment.address);

    const auctionId = parseInt(auctionid);

    console.log(`Revealing results for auction ${auctionId}`);

    const tx = await auctionContract
      .connect(signers[0])
      .revealResults(auctionId);

    console.log(`Transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Results revealed successfully in block: ${receipt?.blockNumber}`);
  });
