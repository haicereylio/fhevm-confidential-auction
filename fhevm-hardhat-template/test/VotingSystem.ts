import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { VotingSystem, VotingSystem__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("VotingSystem")) as VotingSystem__factory;
  const votingSystem = (await factory.deploy()) as VotingSystem;
  const votingSystemAddress = await votingSystem.getAddress();

  return { votingSystem, votingSystemAddress };
}

describe("VotingSystem", function () {
  let signers: Signers;
  let votingSystem: VotingSystem;
  let votingSystemAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { 
      deployer: ethSigners[0], 
      alice: ethSigners[1], 
      bob: ethSigners[2],
      charlie: ethSigners[3]
    };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ votingSystem, votingSystemAddress } = await deployFixture());
  });

  describe("Deployment", function () {
    it("should set the deployer as owner and admin", async function () {
      expect(await votingSystem.owner()).to.equal(signers.deployer.address);
      expect(await votingSystem.admins(signers.deployer.address)).to.be.true;
    });

    it("should initialize with zero votings", async function () {
      expect(await votingSystem.getTotalVotings()).to.equal(0);
    });
  });

  describe("Admin Management", function () {
    it("should allow owner to add/remove admins", async function () {
      // Add alice as admin
      await votingSystem.connect(signers.deployer).setAdmin(signers.alice.address, true);
      expect(await votingSystem.admins(signers.alice.address)).to.be.true;

      // Remove alice as admin
      await votingSystem.connect(signers.deployer).setAdmin(signers.alice.address, false);
      expect(await votingSystem.admins(signers.alice.address)).to.be.false;
    });

    it("should not allow non-owner to add/remove admins", async function () {
      await expect(
        votingSystem.connect(signers.alice).setAdmin(signers.bob.address, true)
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Voting Creation", function () {
    it("should create a public voting successfully", async function () {
      const title = "Test Voting";
      const description = "A test voting for our system";
      const options = ["Option A", "Option B", "Option C"];
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 3600; // 1 hour later

      const tx = await votingSystem.connect(signers.deployer).createVoting(
        title,
        description,
        options,
        startTime,
        endTime,
        true // public
      );

      await expect(tx)
        .to.emit(votingSystem, "VotingCreated")
        .withArgs(0, title, signers.deployer.address);

      const votingInfo = await votingSystem.getVotingInfo(0);
      expect(votingInfo.title).to.equal(title);
      expect(votingInfo.description).to.equal(description);
      expect(votingInfo.options).to.deep.equal(options);
      expect(votingInfo.creator).to.equal(signers.deployer.address);
      expect(votingInfo.isActive).to.be.true;
      expect(votingInfo.isPublic).to.be.true;
      expect(votingInfo.totalVotes).to.equal(0);
    });

    it("should create a private voting successfully", async function () {
      const title = "Private Voting";
      const description = "A private voting with whitelist";
      const options = ["Yes", "No"];
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 3600;

      await votingSystem.connect(signers.deployer).createVoting(
        title,
        description,
        options,
        startTime,
        endTime,
        false // private
      );

      const votingInfo = await votingSystem.getVotingInfo(0);
      expect(votingInfo.isPublic).to.be.false;
    });

    it("should not allow non-admin to create voting", async function () {
      const title = "Unauthorized Voting";
      const description = "This should fail";
      const options = ["Option A", "Option B"];
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 3600;

      await expect(
        votingSystem.connect(signers.alice).createVoting(
          title,
          description,
          options,
          startTime,
          endTime,
          true
        )
      ).to.be.revertedWith("Only admin can call this function");
    });

    it("should not allow creating voting with invalid options count", async function () {
      const title = "Invalid Voting";
      const description = "Too few options";
      const options = ["Only One"]; // Only 1 option
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 3600;

      await expect(
        votingSystem.connect(signers.deployer).createVoting(
          title,
          description,
          options,
          startTime,
          endTime,
          true
        )
      ).to.be.revertedWith("Must have 2-4 options");
    });

    it("should not allow creating voting with invalid time range", async function () {
      const title = "Invalid Time Voting";
      const description = "Invalid time range";
      const options = ["Option A", "Option B"];
      const startTime = Math.floor(Date.now() / 1000) + 3600;
      const endTime = startTime - 1800; // End before start

      await expect(
        votingSystem.connect(signers.deployer).createVoting(
          title,
          description,
          options,
          startTime,
          endTime,
          true
        )
      ).to.be.revertedWith("Invalid time range");
    });
  });

  describe("Whitelist Management", function () {
    beforeEach(async function () {
      // Create a private voting
      const title = "Private Voting";
      const description = "A private voting with whitelist";
      const options = ["Yes", "No"];
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 3600;

      await votingSystem.connect(signers.deployer).createVoting(
        title,
        description,
        options,
        startTime,
        endTime,
        false // private
      );
    });

    it("should add addresses to whitelist", async function () {
      const addresses = [signers.alice.address, signers.bob.address];
      
      await votingSystem.connect(signers.deployer).addToWhitelist(0, addresses);

      expect(await votingSystem.canVoteInVoting(0, signers.alice.address)).to.be.true;
      expect(await votingSystem.canVoteInVoting(0, signers.bob.address)).to.be.true;
      expect(await votingSystem.canVoteInVoting(0, signers.charlie.address)).to.be.false;
    });

    it("should remove addresses from whitelist", async function () {
      const addresses = [signers.alice.address, signers.bob.address];
      
      // Add to whitelist first
      await votingSystem.connect(signers.deployer).addToWhitelist(0, addresses);
      expect(await votingSystem.canVoteInVoting(0, signers.alice.address)).to.be.true;

      // Remove from whitelist
      await votingSystem.connect(signers.deployer).removeFromWhitelist(0, [signers.alice.address]);
      expect(await votingSystem.canVoteInVoting(0, signers.alice.address)).to.be.false;
      expect(await votingSystem.canVoteInVoting(0, signers.bob.address)).to.be.true;
    });

    it("should not allow whitelisting public voting", async function () {
      // Create a public voting
      const title = "Public Voting";
      const description = "A public voting";
      const options = ["Yes", "No"];
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 3600;

      await votingSystem.connect(signers.deployer).createVoting(
        title,
        description,
        options,
        startTime,
        endTime,
        true // public
      );

      await expect(
        votingSystem.connect(signers.deployer).addToWhitelist(1, [signers.alice.address])
      ).to.be.revertedWith("Cannot whitelist public voting");
    });
  });

  describe("Voting Process", function () {
    beforeEach(async function () {
      // Create a public voting
      const title = "Test Voting";
      const description = "A test voting";
      const options = ["Option A", "Option B", "Option C"];
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 3600;

      await votingSystem.connect(signers.deployer).createVoting(
        title,
        description,
        options,
        startTime,
        endTime,
        true // public
      );
    });

    it("should allow voting with encrypted option", async function () {
      const votingId = 0;
      const optionIndex = 1; // Vote for "Option B"

      // Encrypt the option
      const encryptedOption = await fhevm
        .createEncryptedInput(votingSystemAddress, signers.alice.address)
        .add8(optionIndex)
        .encrypt();

      const tx = await votingSystem
        .connect(signers.alice)
        .vote(votingId, encryptedOption.handles[0], encryptedOption.inputProof);

      await expect(tx)
        .to.emit(votingSystem, "VoteCast")
        .withArgs(votingId, signers.alice.address);

      // Check that alice has voted
      expect(await votingSystem.hasVoted(votingId, signers.alice.address)).to.be.true;

      // Check total votes increased
      const votingInfo = await votingSystem.getVotingInfo(votingId);
      expect(votingInfo.totalVotes).to.equal(1);
    });

    it("should not allow double voting", async function () {
      const votingId = 0;
      const optionIndex = 0;

      // First vote
      const encryptedOption1 = await fhevm
        .createEncryptedInput(votingSystemAddress, signers.alice.address)
        .add8(optionIndex)
        .encrypt();

      await votingSystem
        .connect(signers.alice)
        .vote(votingId, encryptedOption1.handles[0], encryptedOption1.inputProof);

      // Second vote should fail
      const encryptedOption2 = await fhevm
        .createEncryptedInput(votingSystemAddress, signers.alice.address)
        .add8(optionIndex)
        .encrypt();

      await expect(
        votingSystem
          .connect(signers.alice)
          .vote(votingId, encryptedOption2.handles[0], encryptedOption2.inputProof)
      ).to.be.revertedWith("Already voted");
    });

    it("should allow multiple users to vote", async function () {
      const votingId = 0;

      // Alice votes for option 0
      const encryptedOption1 = await fhevm
        .createEncryptedInput(votingSystemAddress, signers.alice.address)
        .add8(0)
        .encrypt();

      await votingSystem
        .connect(signers.alice)
        .vote(votingId, encryptedOption1.handles[0], encryptedOption1.inputProof);

      // Bob votes for option 1
      const encryptedOption2 = await fhevm
        .createEncryptedInput(votingSystemAddress, signers.bob.address)
        .add8(1)
        .encrypt();

      await votingSystem
        .connect(signers.bob)
        .vote(votingId, encryptedOption2.handles[0], encryptedOption2.inputProof);

      // Charlie votes for option 2
      const encryptedOption3 = await fhevm
        .createEncryptedInput(votingSystemAddress, signers.charlie.address)
        .add8(2)
        .encrypt();

      await votingSystem
        .connect(signers.charlie)
        .vote(votingId, encryptedOption3.handles[0], encryptedOption3.inputProof);

      // Check total votes
      const votingInfo = await votingSystem.getVotingInfo(votingId);
      expect(votingInfo.totalVotes).to.equal(3);

      // Check individual voting status
      expect(await votingSystem.hasVoted(votingId, signers.alice.address)).to.be.true;
      expect(await votingSystem.hasVoted(votingId, signers.bob.address)).to.be.true;
      expect(await votingSystem.hasVoted(votingId, signers.charlie.address)).to.be.true;
    });
  });

  describe("Voting Management", function () {
    beforeEach(async function () {
      // Create a voting
      const title = "Test Voting";
      const description = "A test voting";
      const options = ["Option A", "Option B"];
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 3600;

      await votingSystem.connect(signers.deployer).createVoting(
        title,
        description,
        options,
        startTime,
        endTime,
        true
      );
    });

    it("should allow creator to end voting", async function () {
      const votingId = 0;

      const tx = await votingSystem.connect(signers.deployer).endVoting(votingId);

      await expect(tx)
        .to.emit(votingSystem, "VotingEnded")
        .withArgs(votingId);

      const votingInfo = await votingSystem.getVotingInfo(votingId);
      expect(votingInfo.isActive).to.be.false;
    });

    it("should not allow non-creator to end voting", async function () {
      const votingId = 0;

      await expect(
        votingSystem.connect(signers.alice).endVoting(votingId)
      ).to.be.revertedWith("Not authorized to end voting");
    });

    it("should not allow voting on ended voting", async function () {
      const votingId = 0;

      // End the voting
      await votingSystem.connect(signers.deployer).endVoting(votingId);

      // Try to vote
      const encryptedOption = await fhevm
        .createEncryptedInput(votingSystemAddress, signers.alice.address)
        .add8(0)
        .encrypt();

      await expect(
        votingSystem
          .connect(signers.alice)
          .vote(votingId, encryptedOption.handles[0], encryptedOption.inputProof)
      ).to.be.revertedWith("Voting is not active");
    });
  });

  describe("Encrypted Vote Counting", function () {
    it("should maintain encrypted vote counts", async function () {
      // Create a voting
      const title = "Count Test";
      const description = "Testing vote counting";
      const options = ["Option A", "Option B"];
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 3600;

      await votingSystem.connect(signers.deployer).createVoting(
        title,
        description,
        options,
        startTime,
        endTime,
        true
      );

      const votingId = 0;

      // Alice votes for option 0
      const encryptedOption1 = await fhevm
        .createEncryptedInput(votingSystemAddress, signers.alice.address)
        .add8(0)
        .encrypt();

      await votingSystem
        .connect(signers.alice)
        .vote(votingId, encryptedOption1.handles[0], encryptedOption1.inputProof);

      // Bob votes for option 0
      const encryptedOption2 = await fhevm
        .createEncryptedInput(votingSystemAddress, signers.bob.address)
        .add8(0)
        .encrypt();

      await votingSystem
        .connect(signers.bob)
        .vote(votingId, encryptedOption2.handles[0], encryptedOption2.inputProof);

      // Charlie votes for option 1
      const encryptedOption3 = await fhevm
        .createEncryptedInput(votingSystemAddress, signers.charlie.address)
        .add8(1)
        .encrypt();

      await votingSystem
        .connect(signers.charlie)
        .vote(votingId, encryptedOption3.handles[0], encryptedOption3.inputProof);

      // Verify that encrypted vote counts exist (non-zero handles)
      const encryptedCount0 = await votingSystem.getEncryptedVoteCount(votingId, 0);
      const encryptedCount1 = await votingSystem.getEncryptedVoteCount(votingId, 1);

      // Check that we have valid encrypted handles (not zero hash)
      expect(encryptedCount0).to.not.equal(ethers.ZeroHash);
      expect(encryptedCount1).to.not.equal(ethers.ZeroHash);

      // Verify total vote count
      const votingInfo = await votingSystem.getVotingInfo(votingId);
      expect(votingInfo.totalVotes).to.equal(3);
    });

    it("should allow creator to decrypt results without making them public", async function () {
      // Create a voting
      const title = "Creator Access Test";
      const description = "Testing creator default access";
      const options = ["Yes", "No"];
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 3600;

      await votingSystem.connect(signers.deployer).createVoting(
        title,
        description,
        options,
        startTime,
        endTime,
        true
      );

      const votingId = 0;

      // Alice votes
      const encryptedOption = await fhevm
        .createEncryptedInput(votingSystemAddress, signers.alice.address)
        .add8(0)
        .encrypt();

      await votingSystem
        .connect(signers.alice)
        .vote(votingId, encryptedOption.handles[0], encryptedOption.inputProof);

      // End the voting
      await votingSystem.connect(signers.deployer).endVoting(votingId);

      // Creator (deployer) should be able to decrypt without making results public
      const encryptedCount0 = await votingSystem.getEncryptedVoteCount(votingId, 0);
      
      // This should work because creator has default access
      const decryptedCount0 = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedCount0,
        votingSystemAddress,
        signers.deployer // Creator should have access
      );

      expect(decryptedCount0).to.equal(1);
    });
  });
});
