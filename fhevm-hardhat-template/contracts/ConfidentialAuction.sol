// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint32, euint64, ebool, externalEuint32, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ConfidentialAuction - Privacy-Preserving Auction System using FHEVM
/// @author ConfidentialAuction Team
/// @notice A confidential auction system where bids are encrypted and anonymous until reveal
contract ConfidentialAuction is SepoliaConfig {
    using FHE for euint32;
    using FHE for euint64;
    using FHE for ebool;

    // Auction Types
    enum AuctionType {
        ENGLISH,    // Traditional ascending price auction
        DUTCH,      // Descending price auction
        SEALED_BID, // Single round sealed bid
        RESERVE     // Auction with reserve price
    }

    enum AuctionStatus {
        PENDING,    // Not started yet
        ACTIVE,     // Currently accepting bids
        EXTENDED,   // Time extended due to last-minute bids
        ENDED,      // Auction finished
        CANCELLED   // Auction cancelled
    }

    // Events
    event AuctionCreated(
        uint256 indexed auctionId, 
        string title, 
        address indexed creator,
        AuctionType auctionType,
        uint256 startTime,
        uint256 endTime
    );
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 timestamp);
    event AutoBidSet(uint256 indexed auctionId, address indexed bidder);
    event AuctionExtended(uint256 indexed auctionId, uint256 newEndTime);
    event AuctionEnded(uint256 indexed auctionId, address winner, uint256 winningBid);
    event AuctionCancelled(uint256 indexed auctionId);
    event ReservePriceSet(uint256 indexed auctionId, bool reserveMet);

    // Structs
    struct Auction {
        string title;
        string description;
        string itemImageUrl;
        address creator;
        AuctionType auctionType;
        AuctionStatus status;
        uint256 startTime;
        uint256 endTime;
        uint256 extensionTime; // Time to extend if bid in last minutes
        uint256 minimumBidIncrement;
        uint256 totalBids;
        bool hasReservePrice;
        euint64 encryptedReservePrice;
        euint64 encryptedHighestBid;
        address currentHighestBidder;
        mapping(address => euint64) encryptedBids; // bidder => encrypted bid amount
        mapping(address => bool) hasBid;
        mapping(address => euint64) encryptedMaxAutoBid; // for auto-bidding
        mapping(address => bool) hasAutoBid;
        mapping(address => uint256) bidTimestamps;
        address[] bidders;
    }

    struct BidInfo {
        address bidder;
        uint256 timestamp;
        bool isAutoBid;
    }

    // State variables
    uint256 public auctionCounter;
    mapping(uint256 => Auction) public auctions;
    mapping(address => bool) public auctioneers; // Authorized auction creators
    address public owner;
    uint256 public platformFeePercent = 250; // 2.5% platform fee (basis points)
    uint256 public constant EXTENSION_THRESHOLD = 300; // 5 minutes in seconds

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAuctioneer() {
        require(auctioneers[msg.sender] || msg.sender == owner, "Only authorized auctioneers");
        _;
    }

    modifier auctionExists(uint256 _auctionId) {
        require(_auctionId < auctionCounter, "Auction does not exist");
        _;
    }

    modifier auctionActive(uint256 _auctionId) {
        require(auctions[_auctionId].status == AuctionStatus.PENDING || 
                auctions[_auctionId].status == AuctionStatus.ACTIVE || 
                auctions[_auctionId].status == AuctionStatus.EXTENDED, "Auction not active");
        require(block.timestamp >= auctions[_auctionId].startTime, "Auction not started");
        require(block.timestamp <= auctions[_auctionId].endTime, "Auction ended");
        _;
    }

    modifier canBid(uint256 _auctionId) {
        require(msg.sender != auctions[_auctionId].creator, "Creator cannot bid");
        _;
    }

    constructor() {
        owner = msg.sender;
        auctioneers[msg.sender] = true;
    }

    /// @notice Set auctioneer status
    /// @param _auctioneer Address to modify
    /// @param _isAuctioneer True to authorize, false to revoke
    function setAuctioneer(address _auctioneer, bool _isAuctioneer) external onlyOwner {
        auctioneers[_auctioneer] = _isAuctioneer;
    }

    /// @notice Set platform fee percentage
    /// @param _feePercent Fee in basis points (100 = 1%)
    function setPlatformFee(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 1000, "Fee cannot exceed 10%");
        platformFeePercent = _feePercent;
    }

    /// @notice Create a new auction
    function createAuction(
        string memory _title,
        string memory _description,
        string memory _itemImageUrl,
        AuctionType _auctionType,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _minimumBidIncrement,
        uint256 _extensionTime,
        bool _hasReservePrice,
        externalEuint64 _encryptedReservePrice,
        bytes calldata _reserveProof
    ) external onlyAuctioneer {
        require(_startTime < _endTime, "Invalid time range");
        require(_endTime > block.timestamp, "End time must be in future");
        require(_minimumBidIncrement > 0, "Minimum bid increment must be positive");

        uint256 auctionId = auctionCounter++;
        
        _initializeAuction(
            auctionId,
            _title,
            _description,
            _itemImageUrl,
            _auctionType,
            _startTime,
            _endTime,
            _minimumBidIncrement,
            _extensionTime,
            _hasReservePrice,
            _encryptedReservePrice,
            _reserveProof
        );

        emit AuctionCreated(auctionId, _title, msg.sender, _auctionType, _startTime, _endTime);
    }

    /// @notice Internal function to initialize auction data
    function _initializeAuction(
        uint256 auctionId,
        string memory _title,
        string memory _description,
        string memory _itemImageUrl,
        AuctionType _auctionType,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _minimumBidIncrement,
        uint256 _extensionTime,
        bool _hasReservePrice,
        externalEuint64 _encryptedReservePrice,
        bytes calldata _reserveProof
    ) internal {
        Auction storage newAuction = auctions[auctionId];

        newAuction.title = _title;
        newAuction.description = _description;
        newAuction.itemImageUrl = _itemImageUrl;
        newAuction.creator = msg.sender;
        newAuction.auctionType = _auctionType;
        newAuction.status = AuctionStatus.PENDING;
        newAuction.startTime = _startTime;
        newAuction.endTime = _endTime;
        newAuction.extensionTime = _extensionTime;
        newAuction.minimumBidIncrement = _minimumBidIncrement;
        newAuction.totalBids = 0;
        newAuction.hasReservePrice = _hasReservePrice;

        // Initialize encrypted values
        newAuction.encryptedHighestBid = FHE.asEuint64(0);
        FHE.allowThis(newAuction.encryptedHighestBid);
        FHE.allow(newAuction.encryptedHighestBid, msg.sender);

        if (_hasReservePrice) {
            newAuction.encryptedReservePrice = FHE.fromExternal(_encryptedReservePrice, _reserveProof);
            FHE.allowThis(newAuction.encryptedReservePrice);
            FHE.allow(newAuction.encryptedReservePrice, msg.sender);
        }
    }

    /// @notice Place an encrypted bid
    /// @param _auctionId Auction ID
    /// @param _encryptedBid Encrypted bid amount
    /// @param _inputProof Proof for encrypted bid
    function placeBid(
        uint256 _auctionId,
        externalEuint64 _encryptedBid,
        bytes calldata _inputProof
    ) external auctionExists(_auctionId) auctionActive(_auctionId) canBid(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        
        // Update auction status to active if it was pending
        if (auction.status == AuctionStatus.PENDING) {
            auction.status = AuctionStatus.ACTIVE;
        }

        euint64 bidAmount = FHE.fromExternal(_encryptedBid, _inputProof);

        // Check if bid is higher than current highest bid
        ebool isHigherBid = FHE.gt(bidAmount, auction.encryptedHighestBid);
        
        // Update highest bid if this bid is higher
        auction.encryptedHighestBid = FHE.select(
            isHigherBid,
            bidAmount,
            auction.encryptedHighestBid
        );

        // Store bidder's bid
        auction.encryptedBids[msg.sender] = bidAmount;
        auction.bidTimestamps[msg.sender] = block.timestamp;

        // Add to bidders list if first bid
        if (!auction.hasBid[msg.sender]) {
            auction.hasBid[msg.sender] = true;
            auction.bidders.push(msg.sender);
        }

        auction.totalBids++;

        // Grant permissions
        FHE.allowThis(auction.encryptedHighestBid);
        FHE.allow(auction.encryptedHighestBid, auction.creator);
        FHE.allowThis(auction.encryptedBids[msg.sender]);
        FHE.allow(auction.encryptedBids[msg.sender], msg.sender);

        // Check if auction should be extended (bid in last 5 minutes)
        if (auction.endTime - block.timestamp <= EXTENSION_THRESHOLD && auction.extensionTime > 0) {
            auction.endTime += auction.extensionTime;
            auction.status = AuctionStatus.EXTENDED;
            emit AuctionExtended(_auctionId, auction.endTime);
        }

        emit BidPlaced(_auctionId, msg.sender, block.timestamp);
    }

    /// @notice Set up auto-bidding with maximum bid amount
    /// @param _auctionId Auction ID
    /// @param _encryptedMaxBid Encrypted maximum bid amount
    /// @param _inputProof Proof for encrypted max bid
    function setAutoBid(
        uint256 _auctionId,
        externalEuint64 _encryptedMaxBid,
        bytes calldata _inputProof
    ) external auctionExists(_auctionId) canBid(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        require(auction.status == AuctionStatus.PENDING || auction.status == AuctionStatus.ACTIVE, 
                "Cannot set auto-bid on ended auction");

        euint64 maxBidAmount = FHE.fromExternal(_encryptedMaxBid, _inputProof);
        auction.encryptedMaxAutoBid[msg.sender] = maxBidAmount;
        auction.hasAutoBid[msg.sender] = true;

        // Grant permissions
        FHE.allowThis(auction.encryptedMaxAutoBid[msg.sender]);
        FHE.allow(auction.encryptedMaxAutoBid[msg.sender], msg.sender);

        emit AutoBidSet(_auctionId, msg.sender);
    }

    /// @notice End auction manually (only creator or owner)
    /// @param _auctionId Auction ID
    function endAuction(uint256 _auctionId) external auctionExists(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        require(msg.sender == auction.creator || msg.sender == owner, "Not authorized");
        require(auction.status == AuctionStatus.ACTIVE || auction.status == AuctionStatus.EXTENDED, 
                "Auction not active");

        auction.status = AuctionStatus.ENDED;
        emit AuctionEnded(_auctionId, auction.currentHighestBidder, 0); // Actual amount revealed later
    }

    /// @notice Cancel auction (only creator, before any bids)
    /// @param _auctionId Auction ID
    function cancelAuction(uint256 _auctionId) external auctionExists(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        require(msg.sender == auction.creator || msg.sender == owner, "Not authorized");
        require(auction.totalBids == 0, "Cannot cancel auction with bids");
        require(auction.status != AuctionStatus.ENDED, "Auction already ended");

        auction.status = AuctionStatus.CANCELLED;
        emit AuctionCancelled(_auctionId);
    }

    /// @notice Make auction results publicly decryptable
    /// @param _auctionId Auction ID
    function revealResults(uint256 _auctionId) external auctionExists(_auctionId) {
        Auction storage auction = auctions[_auctionId];
        require(auction.status == AuctionStatus.ENDED || block.timestamp > auction.endTime, 
                "Auction not finished");
        require(msg.sender == auction.creator || msg.sender == owner, "Not authorized");

        // Make highest bid publicly decryptable
        FHE.makePubliclyDecryptable(auction.encryptedHighestBid);

        // Make reserve price decryptable if exists
        if (auction.hasReservePrice) {
            FHE.makePubliclyDecryptable(auction.encryptedReservePrice);
        }
    }

    /// @notice Get auction information
    /// @param _auctionId Auction ID
    function getAuctionInfo(uint256 _auctionId) 
        external 
        view 
        auctionExists(_auctionId) 
        returns (
            string memory title,
            string memory description,
            string memory itemImageUrl,
            address creator,
            AuctionType auctionType,
            AuctionStatus status,
            uint256 startTime,
            uint256 endTime,
            uint256 minimumBidIncrement,
            uint256 totalBids,
            bool hasReservePrice
        ) 
    {
        Auction storage auction = auctions[_auctionId];
        return (
            auction.title,
            auction.description,
            auction.itemImageUrl,
            auction.creator,
            auction.auctionType,
            auction.status,
            auction.startTime,
            auction.endTime,
            auction.minimumBidIncrement,
            auction.totalBids,
            auction.hasReservePrice
        );
    }

    /// @notice Get encrypted highest bid
    /// @param _auctionId Auction ID
    function getEncryptedHighestBid(uint256 _auctionId) 
        external 
        view 
        auctionExists(_auctionId) 
        returns (euint64) 
    {
        return auctions[_auctionId].encryptedHighestBid;
    }

    /// @notice Get user's encrypted bid
    /// @param _auctionId Auction ID
    /// @param _bidder Bidder address
    function getUserBid(uint256 _auctionId, address _bidder) 
        external 
        view 
        auctionExists(_auctionId) 
        returns (euint64) 
    {
        return auctions[_auctionId].encryptedBids[_bidder];
    }

    /// @notice Check if user has bid
    /// @param _auctionId Auction ID
    /// @param _bidder Bidder address
    function hasBidder(uint256 _auctionId, address _bidder) 
        external 
        view 
        auctionExists(_auctionId) 
        returns (bool) 
    {
        return auctions[_auctionId].hasBid[_bidder];
    }

    /// @notice Get total number of auctions
    function getTotalAuctions() external view returns (uint256) {
        return auctionCounter;
    }

    /// @notice Get auction bidders
    /// @param _auctionId Auction ID
    function getAuctionBidders(uint256 _auctionId) 
        external 
        view 
        auctionExists(_auctionId) 
        returns (address[] memory) 
    {
        return auctions[_auctionId].bidders;
    }

    /// @notice Check if auction has ended
    /// @param _auctionId Auction ID
    function isAuctionEnded(uint256 _auctionId) 
        external 
        view 
        auctionExists(_auctionId) 
        returns (bool) 
    {
        Auction storage auction = auctions[_auctionId];
        return auction.status == AuctionStatus.ENDED || 
               auction.status == AuctionStatus.CANCELLED ||
               block.timestamp > auction.endTime;
    }
}
