// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint32, ebool, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ZamaVoting - Confidential Voting System using FHEVM
/// @author ZamaVoting Team
/// @notice A privacy-preserving voting system where votes are encrypted and anonymous
contract VotingSystem is SepoliaConfig {
    using FHE for euint8;
    using FHE for euint32;
    using FHE for ebool;

    // Events
    event VotingCreated(uint256 indexed votingId, string title, address indexed creator);
    event VoteCast(uint256 indexed votingId, address indexed voter);
    event VotingEnded(uint256 indexed votingId);
    event VotingResultsRevealed(uint256 indexed votingId, uint256[] results);

    // Structs
    struct Voting {
        string title;
        string description;
        string[] options;
        address creator;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool isPublic; // true for public voting, false for whitelist only
        uint256 totalVotes;
        mapping(uint256 => euint32) encryptedVoteCounts; // optionIndex => encrypted count
        mapping(address => bool) hasVoted;
        mapping(address => bool) whitelist; // for private votings
    }

    // State variables
    uint256 public votingCounter;
    mapping(uint256 => Voting) public votings;
    
    // Access control
    mapping(address => bool) public admins;
    address public owner;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner, "Only admin can call this function");
        _;
    }

    modifier votingExists(uint256 _votingId) {
        require(_votingId < votingCounter, "Voting does not exist");
        _;
    }

    modifier votingActive(uint256 _votingId) {
        require(votings[_votingId].isActive, "Voting is not active");
        require(block.timestamp >= votings[_votingId].startTime, "Voting has not started yet");
        require(block.timestamp <= votings[_votingId].endTime, "Voting has ended");
        _;
    }

    modifier canVote(uint256 _votingId) {
        require(!votings[_votingId].hasVoted[msg.sender], "Already voted");
        if (!votings[_votingId].isPublic) {
            require(votings[_votingId].whitelist[msg.sender], "Not authorized to vote");
        }
        _;
    }

    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true;
    }

    /// @notice Add or remove admin
    /// @param _admin Address to modify admin status
    /// @param _isAdmin True to add admin, false to remove
    function setAdmin(address _admin, bool _isAdmin) external onlyOwner {
        admins[_admin] = _isAdmin;
    }

    /// @notice Create a new voting
    /// @param _title Title of the voting
    /// @param _description Description of the voting
    /// @param _options Array of voting options (2-4 options)
    /// @param _startTime Start timestamp
    /// @param _endTime End timestamp
    /// @param _isPublic True for public voting, false for whitelist only
    function createVoting(
        string memory _title,
        string memory _description,
        string[] memory _options,
        uint256 _startTime,
        uint256 _endTime,
        bool _isPublic
    ) external onlyAdmin {
        require(_options.length >= 2 && _options.length <= 4, "Must have 2-4 options");
        require(_startTime < _endTime, "Invalid time range");
        require(_endTime > block.timestamp, "End time must be in the future");

        uint256 votingId = votingCounter++;
        Voting storage newVoting = votings[votingId];
        
        newVoting.title = _title;
        newVoting.description = _description;
        newVoting.options = _options;
        newVoting.creator = msg.sender;
        newVoting.startTime = _startTime;
        newVoting.endTime = _endTime;
        newVoting.isActive = true;
        newVoting.isPublic = _isPublic;
        newVoting.totalVotes = 0;

        // Initialize encrypted vote counts to 0 and grant creator access
        for (uint256 i = 0; i < _options.length; i++) {
            newVoting.encryptedVoteCounts[i] = FHE.asEuint32(0);
            FHE.allowThis(newVoting.encryptedVoteCounts[i]);
            FHE.allow(newVoting.encryptedVoteCounts[i], msg.sender); // Grant creator access
        }

        emit VotingCreated(votingId, _title, msg.sender);
    }

    /// @notice Add addresses to voting whitelist
    /// @param _votingId Voting ID
    /// @param _addresses Array of addresses to whitelist
    function addToWhitelist(uint256 _votingId, address[] memory _addresses) 
        external 
        votingExists(_votingId) 
        onlyAdmin 
    {
        require(!votings[_votingId].isPublic, "Cannot whitelist public voting");
        
        for (uint256 i = 0; i < _addresses.length; i++) {
            votings[_votingId].whitelist[_addresses[i]] = true;
        }
    }

    /// @notice Remove addresses from voting whitelist
    /// @param _votingId Voting ID
    /// @param _addresses Array of addresses to remove from whitelist
    function removeFromWhitelist(uint256 _votingId, address[] memory _addresses) 
        external 
        votingExists(_votingId) 
        onlyAdmin 
    {
        for (uint256 i = 0; i < _addresses.length; i++) {
            votings[_votingId].whitelist[_addresses[i]] = false;
        }
    }

    /// @notice Cast an encrypted vote
    /// @param _votingId Voting ID
    /// @param _encryptedOption Encrypted option index (0-3)
    /// @param _inputProof Input proof for the encrypted value
    function vote(
        uint256 _votingId,
        externalEuint8 _encryptedOption,
        bytes calldata _inputProof
    ) external votingExists(_votingId) votingActive(_votingId) canVote(_votingId) {
        euint8 encryptedOption = FHE.fromExternal(_encryptedOption, _inputProof);
        uint256 optionsLength = votings[_votingId].options.length;
        
        // Simplified voting logic - increment all options based on encrypted comparison
        for (uint256 i = 0; i < optionsLength; i++) {
            ebool isThisOption = FHE.eq(encryptedOption, FHE.asEuint8(uint8(i)));
            euint32 increment = FHE.select(isThisOption, FHE.asEuint32(1), FHE.asEuint32(0));
            
            votings[_votingId].encryptedVoteCounts[i] = FHE.add(
                votings[_votingId].encryptedVoteCounts[i], 
                increment
            );
            
            FHE.allowThis(votings[_votingId].encryptedVoteCounts[i]);
            FHE.allow(votings[_votingId].encryptedVoteCounts[i], msg.sender);
            FHE.allow(votings[_votingId].encryptedVoteCounts[i], votings[_votingId].creator); // Always allow creator
        }

        votings[_votingId].hasVoted[msg.sender] = true;
        votings[_votingId].totalVotes++;

        emit VoteCast(_votingId, msg.sender);
    }

    /// @notice End a voting (only creator or admin)
    /// @param _votingId Voting ID
    function endVoting(uint256 _votingId) external votingExists(_votingId) {
        require(
            msg.sender == votings[_votingId].creator || admins[msg.sender] || msg.sender == owner,
            "Not authorized to end voting"
        );
        require(votings[_votingId].isActive, "Voting already ended");

        votings[_votingId].isActive = false;
        emit VotingEnded(_votingId);
    }

    /// @notice Make voting results publicly decryptable (simplified approach)
    /// @param _votingId Voting ID
    function makeResultsPublic(uint256 _votingId) external votingExists(_votingId) {
        require(!votings[_votingId].isActive, "Voting is still active");
        require(
            msg.sender == votings[_votingId].creator || admins[msg.sender] || msg.sender == owner,
            "Not authorized to make results public"
        );

        uint256 optionsLength = votings[_votingId].options.length;
        
        for (uint256 i = 0; i < optionsLength; i++) {
            // Make each vote count publicly decryptable
            FHE.makePubliclyDecryptable(votings[_votingId].encryptedVoteCounts[i]);
        }

        emit VotingResultsRevealed(_votingId, new uint256[](optionsLength));
    }

    /// @notice Get voting information
    /// @param _votingId Voting ID
    /// @return title Title of the voting
    /// @return description Description of the voting
    /// @return options Array of voting options
    /// @return creator Address of the voting creator
    /// @return startTime Start timestamp
    /// @return endTime End timestamp
    /// @return isActive Whether the voting is active
    /// @return isPublic Whether the voting is public
    /// @return totalVotes Total number of votes cast
    function getVotingInfo(uint256 _votingId) 
        external 
        view 
        votingExists(_votingId) 
        returns (
            string memory title,
            string memory description,
            string[] memory options,
            address creator,
            uint256 startTime,
            uint256 endTime,
            bool isActive,
            bool isPublic,
            uint256 totalVotes
        ) 
    {
        Voting storage voting = votings[_votingId];
        return (
            voting.title,
            voting.description,
            voting.options,
            voting.creator,
            voting.startTime,
            voting.endTime,
            voting.isActive,
            voting.isPublic,
            voting.totalVotes
        );
    }

    /// @notice Get encrypted vote count for an option
    /// @param _votingId Voting ID
    /// @param _optionIndex Option index
    /// @return Encrypted vote count handle
    function getEncryptedVoteCount(uint256 _votingId, uint256 _optionIndex) 
        external 
        view 
        votingExists(_votingId) 
        returns (euint32) 
    {
        require(_optionIndex < votings[_votingId].options.length, "Invalid option index");
        return votings[_votingId].encryptedVoteCounts[_optionIndex];
    }


    /// @notice Check if an address has voted
    /// @param _votingId Voting ID
    /// @param _voter Voter address
    /// @return True if voted, false otherwise
    function hasVoted(uint256 _votingId, address _voter) 
        external 
        view 
        votingExists(_votingId) 
        returns (bool) 
    {
        return votings[_votingId].hasVoted[_voter];
    }

    /// @notice Check if an address is whitelisted for a voting
    /// @param _votingId Voting ID
    /// @param _voter Voter address
    /// @return True if whitelisted or voting is public, false otherwise
    function canVoteInVoting(uint256 _votingId, address _voter) 
        external 
        view 
        votingExists(_votingId) 
        returns (bool) 
    {
        if (votings[_votingId].isPublic) {
            return true;
        }
        return votings[_votingId].whitelist[_voter];
    }

    /// @notice Get total number of votings
    /// @return Total voting count
    function getTotalVotings() external view returns (uint256) {
        return votingCounter;
    }
}
