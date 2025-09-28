import { expect } from "chai";
import { ethers } from "hardhat";
import { ConfidentialAuction } from "../types";
import { Signer } from "ethers";
import { createInstance } from "fhevmjs";

describe("ConfidentialAuction", function () {
  let confidentialAuction: ConfidentialAuction;
  let owner: Signer;
  let auctioneer: Signer;
  let bidder1: Signer;
  let bidder2: Signer;
  let bidder3: Signer;
  let fhevm: any;
  let contractAddress: string;

  const signers = {
    owner: {} as Signer,
    auctioneer: {} as Signer,
    bidder1: {} as Signer,
    bidder2: {} as Signer,
    bidder3: {} as Signer,
  };

  beforeEach(async function () {
    [owner, auctioneer, bidder1, bidder2, bidder3] = await ethers.getSigners();
    
    signers.owner = owner;
    signers.auctioneer = auctioneer;
    signers.bidder1 = bidder1;
    signers.bidder2 = bidder2;
    signers.bidder3 = bidder3;

    const ConfidentialAuctionFactory = await ethers.getContractFactory("ConfidentialAuction");
    confidentialAuction = await ConfidentialAuctionFactory.deploy();
    await confidentialAuction.waitForDeployment();
    
    contractAddress = await confidentialAuction.getAddress();

    // Initialize FHEVM instance
    fhevm = await createInstance({
      chainId: 31337,
      publicKeyOrParams: await confidentialAuction.getPublicKey(),
    });

    // Set up auctioneer
    await confidentialAuction.connect(owner).setAuctioneer(await auctioneer.getAddress(), true);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await confidentialAuction.owner()).to.equal(await owner.getAddress());
    });

    it("Should set owner as auctioneer", async function () {
      expect(await confidentialAuction.auctioneers(await owner.getAddress())).to.be.true;
    });

    it("Should set default platform fee", async function () {
      expect(await confidentialAuction.platformFeePercent()).to.equal(250); // 2.5%
    });
  });

  describe("Auctioneer Management", function () {
    it("Should allow owner to set auctioneers", async function () {
      const newAuctioneer = bidder1;
      await confidentialAuction.connect(owner).setAuctioneer(await newAuctioneer.getAddress(), true);
      expect(await confidentialAuction.auctioneers(await newAuctioneer.getAddress())).to.be.true;
    });

    it("Should allow owner to remove auctioneers", async function () {
      await confidentialAuction.connect(owner).setAuctioneer(await auctioneer.getAddress(), false);
      expect(await confidentialAuction.auctioneers(await auctioneer.getAddress())).to.be.false;
    });

    it("Should not allow non-owner to set auctioneers", async function () {
      await expect(
        confidentialAuction.connect(bidder1).setAuctioneer(await bidder2.getAddress(), true)
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Platform Fee Management", function () {
    it("Should allow owner to set platform fee", async function () {
      await confidentialAuction.connect(owner).setPlatformFee(500); // 5%
      expect(await confidentialAuction.platformFeePercent()).to.equal(500);
    });

    it("Should not allow fee above 10%", async function () {
      await expect(
        confidentialAuction.connect(owner).setPlatformFee(1001)
      ).to.be.revertedWith("Fee cannot exceed 10%");
    });

    it("Should not allow non-owner to set fee", async function () {
      await expect(
        confidentialAuction.connect(bidder1).setPlatformFee(300)
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Auction Creation", function () {
    it("Should create an English auction", async function () {
      const title = "Test Auction";
      const description = "Test Description";
      const imageUrl = "https://example.com/image.jpg";
      const auctionType = 0; // ENGLISH
      const startTime = Math.floor(Date.now() / 1000) + 100;
      const endTime = startTime + 3600;
      const minimumBidIncrement = ethers.parseEther("0.01");
      const extensionTime = 300;

      await expect(
        confidentialAuction.connect(auctioneer).createAuction(
          title,
          description,
          imageUrl,
          auctionType,
          startTime,
          endTime,
          minimumBidIncrement,
          extensionTime,
          false, // no reserve price
          0, // dummy encrypted value
          "0x" // empty proof
        )
      ).to.emit(confidentialAuction, "AuctionCreated");

      const auctionInfo = await confidentialAuction.getAuctionInfo(0);
      expect(auctionInfo.title).to.equal(title);
      expect(auctionInfo.description).to.equal(description);
      expect(auctionInfo.creator).to.equal(await auctioneer.getAddress());
      expect(auctionInfo.auctionType).to.equal(0);
    });

    it("Should create auction with reserve price", async function () {
      const title = "Reserve Auction";
      const description = "Auction with reserve";
      const imageUrl = "";
      const auctionType = 3; // RESERVE
      const startTime = Math.floor(Date.now() / 1000) + 100;
      const endTime = startTime + 3600;
      const minimumBidIncrement = ethers.parseEther("0.01");
      const extensionTime = 300;
      const reservePrice = ethers.parseEther("1.0");

      // Encrypt reserve price
      const encryptedReserve = await fhevm
        .createEncryptedInput(contractAddress, await auctioneer.getAddress())
        .add64(reservePrice)
        .encrypt();

      await expect(
        confidentialAuction.connect(auctioneer).createAuction(
          title,
          description,
          imageUrl,
          auctionType,
          startTime,
          endTime,
          minimumBidIncrement,
          extensionTime,
          true, // has reserve price
          encryptedReserve.handles[0],
          encryptedReserve.inputProof
        )
      ).to.emit(confidentialAuction, "AuctionCreated");

      const auctionInfo = await confidentialAuction.getAuctionInfo(0);
      expect(auctionInfo.hasReservePrice).to.be.true;
    });

    it("Should not allow non-auctioneer to create auction", async function () {
      const title = "Unauthorized Auction";
      const description = "Should fail";
      const startTime = Math.floor(Date.now() / 1000) + 100;
      const endTime = startTime + 3600;

      await expect(
        confidentialAuction.connect(bidder1).createAuction(
          title,
          description,
          "",
          0,
          startTime,
          endTime,
          ethers.parseEther("0.01"),
          300,
          false,
          0,
          "0x"
        )
      ).to.be.revertedWith("Only authorized auctioneers");
    });

    it("Should not allow invalid time range", async function () {
      const startTime = Math.floor(Date.now() / 1000) + 3600;
      const endTime = startTime - 1000; // End before start

      await expect(
        confidentialAuction.connect(auctioneer).createAuction(
          "Invalid Time",
          "Bad timing",
          "",
          0,
          startTime,
          endTime,
          ethers.parseEther("0.01"),
          300,
          false,
          0,
          "0x"
        )
      ).to.be.revertedWith("Invalid time range");
    });
  });

  describe("Bidding", function () {
    let auctionId: number;

    beforeEach(async function () {
      // Create a test auction
      const title = "Bidding Test Auction";
      const description = "Test bidding functionality";
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 3600;

      await confidentialAuction.connect(auctioneer).createAuction(
        title,
        description,
        "",
        0, // ENGLISH
        startTime,
        endTime,
        ethers.parseEther("0.01"),
        300,
        false,
        0,
        "0x"
      );

      auctionId = 0;
    });

    it("Should allow placing encrypted bids", async function () {
      const bidAmount = ethers.parseEther("1.0");

      // Encrypt bid
      const encryptedBid = await fhevm
        .createEncryptedInput(contractAddress, await bidder1.getAddress())
        .add64(bidAmount)
        .encrypt();

      await expect(
        confidentialAuction
          .connect(bidder1)
          .placeBid(auctionId, encryptedBid.handles[0], encryptedBid.inputProof)
      ).to.emit(confidentialAuction, "BidPlaced");

      // Check that bid was recorded
      expect(await confidentialAuction.hasBidder(auctionId, await bidder1.getAddress())).to.be.true;
      
      const auctionInfo = await confidentialAuction.getAuctionInfo(auctionId);
      expect(auctionInfo.totalBids).to.equal(1);
    });

    it("Should allow multiple bids", async function () {
      // Bidder 1 bids
      const bid1Amount = ethers.parseEther("1.0");
      const encryptedBid1 = await fhevm
        .createEncryptedInput(contractAddress, await bidder1.getAddress())
        .add64(bid1Amount)
        .encrypt();

      await confidentialAuction
        .connect(bidder1)
        .placeBid(auctionId, encryptedBid1.handles[0], encryptedBid1.inputProof);

      // Bidder 2 bids
      const bid2Amount = ethers.parseEther("1.5");
      const encryptedBid2 = await fhevm
        .createEncryptedInput(contractAddress, await bidder2.getAddress())
        .add64(bid2Amount)
        .encrypt();

      await confidentialAuction
        .connect(bidder2)
        .placeBid(auctionId, encryptedBid2.handles[0], encryptedBid2.inputProof);

      const auctionInfo = await confidentialAuction.getAuctionInfo(auctionId);
      expect(auctionInfo.totalBids).to.equal(2);

      // Check bidders list
      const bidders = await confidentialAuction.getAuctionBidders(auctionId);
      expect(bidders).to.include(await bidder1.getAddress());
      expect(bidders).to.include(await bidder2.getAddress());
    });

    it("Should not allow creator to bid", async function () {
      const bidAmount = ethers.parseEther("1.0");
      const encryptedBid = await fhevm
        .createEncryptedInput(contractAddress, await auctioneer.getAddress())
        .add64(bidAmount)
        .encrypt();

      await expect(
        confidentialAuction
          .connect(auctioneer)
          .placeBid(auctionId, encryptedBid.handles[0], encryptedBid.inputProof)
      ).to.be.revertedWith("Creator cannot bid");
    });
  });

  describe("Auto-bidding", function () {
    let auctionId: number;

    beforeEach(async function () {
      // Create a test auction
      await confidentialAuction.connect(auctioneer).createAuction(
        "Auto-bid Test",
        "Test auto-bidding",
        "",
        0,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + 3600,
        ethers.parseEther("0.01"),
        300,
        false,
        0,
        "0x"
      );
      auctionId = 0;
    });

    it("Should allow setting auto-bid", async function () {
      const maxBidAmount = ethers.parseEther("5.0");

      const encryptedMaxBid = await fhevm
        .createEncryptedInput(contractAddress, await bidder1.getAddress())
        .add64(maxBidAmount)
        .encrypt();

      await expect(
        confidentialAuction
          .connect(bidder1)
          .setAutoBid(auctionId, encryptedMaxBid.handles[0], encryptedMaxBid.inputProof)
      ).to.emit(confidentialAuction, "AutoBidSet");
    });

    it("Should not allow creator to set auto-bid", async function () {
      const maxBidAmount = ethers.parseEther("5.0");
      const encryptedMaxBid = await fhevm
        .createEncryptedInput(contractAddress, await auctioneer.getAddress())
        .add64(maxBidAmount)
        .encrypt();

      await expect(
        confidentialAuction
          .connect(auctioneer)
          .setAutoBid(auctionId, encryptedMaxBid.handles[0], encryptedMaxBid.inputProof)
      ).to.be.revertedWith("Creator cannot bid");
    });
  });

  describe("Auction Management", function () {
    let auctionId: number;

    beforeEach(async function () {
      await confidentialAuction.connect(auctioneer).createAuction(
        "Management Test",
        "Test auction management",
        "",
        0,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + 3600,
        ethers.parseEther("0.01"),
        300,
        false,
        0,
        "0x"
      );
      auctionId = 0;
    });

    it("Should allow creator to end auction", async function () {
      await expect(
        confidentialAuction.connect(auctioneer).endAuction(auctionId)
      ).to.emit(confidentialAuction, "AuctionEnded");

      const auctionInfo = await confidentialAuction.getAuctionInfo(auctionId);
      expect(auctionInfo.status).to.equal(3); // ENDED
    });

    it("Should allow owner to end auction", async function () {
      await expect(
        confidentialAuction.connect(owner).endAuction(auctionId)
      ).to.emit(confidentialAuction, "AuctionEnded");
    });

    it("Should not allow unauthorized user to end auction", async function () {
      await expect(
        confidentialAuction.connect(bidder1).endAuction(auctionId)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should allow creator to cancel auction with no bids", async function () {
      await expect(
        confidentialAuction.connect(auctioneer).cancelAuction(auctionId)
      ).to.emit(confidentialAuction, "AuctionCancelled");

      const auctionInfo = await confidentialAuction.getAuctionInfo(auctionId);
      expect(auctionInfo.status).to.equal(4); // CANCELLED
    });

    it("Should not allow cancelling auction with bids", async function () {
      // Place a bid first
      const bidAmount = ethers.parseEther("1.0");
      const encryptedBid = await fhevm
        .createEncryptedInput(contractAddress, await bidder1.getAddress())
        .add64(bidAmount)
        .encrypt();

      await confidentialAuction
        .connect(bidder1)
        .placeBid(auctionId, encryptedBid.handles[0], encryptedBid.inputProof);

      await expect(
        confidentialAuction.connect(auctioneer).cancelAuction(auctionId)
      ).to.be.revertedWith("Cannot cancel auction with bids");
    });
  });

  describe("Result Revelation", function () {
    let auctionId: number;

    beforeEach(async function () {
      await confidentialAuction.connect(auctioneer).createAuction(
        "Reveal Test",
        "Test result revelation",
        "",
        0,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + 3600,
        ethers.parseEther("0.01"),
        300,
        false,
        0,
        "0x"
      );
      auctionId = 0;

      // End the auction
      await confidentialAuction.connect(auctioneer).endAuction(auctionId);
    });

    it("Should allow creator to reveal results", async function () {
      await expect(
        confidentialAuction.connect(auctioneer).revealResults(auctionId)
      ).to.not.be.reverted;
    });

    it("Should allow owner to reveal results", async function () {
      await expect(
        confidentialAuction.connect(owner).revealResults(auctionId)
      ).to.not.be.reverted;
    });

    it("Should not allow unauthorized user to reveal results", async function () {
      await expect(
        confidentialAuction.connect(bidder1).revealResults(auctionId)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("View Functions", function () {
    it("Should return correct total auctions", async function () {
      expect(await confidentialAuction.getTotalAuctions()).to.equal(0);

      // Create an auction
      await confidentialAuction.connect(auctioneer).createAuction(
        "Test",
        "Test",
        "",
        0,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + 3600,
        ethers.parseEther("0.01"),
        300,
        false,
        0,
        "0x"
      );

      expect(await confidentialAuction.getTotalAuctions()).to.equal(1);
    });

    it("Should check if auction has ended", async function () {
      // Create auction that ends in the past
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      await confidentialAuction.connect(auctioneer).createAuction(
        "Past Auction",
        "Already ended",
        "",
        0,
        pastTime - 1000,
        pastTime,
        ethers.parseEther("0.01"),
        300,
        false,
        0,
        "0x"
      );

      expect(await confidentialAuction.isAuctionEnded(0)).to.be.true;
    });
  });
});

