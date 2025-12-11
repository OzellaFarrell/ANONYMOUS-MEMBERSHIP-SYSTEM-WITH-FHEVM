// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, euint8, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title BlindAuction
/// @notice Privacy-preserving sealed-bid auction using FHE
/// @dev Demonstrates encrypted bidding where bids are private until reveal
contract BlindAuction is ZamaEthereumConfig {
  /// @notice Auction state
  enum AuctionState {
    BIDDING,
    REVEAL,
    ENDED
  }

  /// @notice Auction configuration
  struct Auction {
    address owner;
    euint32 highestBid;
    address highestBidder;
    AuctionState state;
    uint endTime;
    bool finalized;
  }

  /// @notice Active auction
  Auction private auction;

  /// @notice Bidder's encrypted bid
  mapping(address => euint32) private bids;

  /// @notice Track if bidder has bid
  mapping(address => bool) private hasBid;

  /// @notice Events
  event AuctionCreated(address indexed owner, uint endTime);
  event BidPlaced(address indexed bidder);
  event AuctionRevealed(address indexed winner, uint32 winningBid);
  event AuctionFinalized();

  /// @notice Initialize new auction
  /// @param duration Auction duration in seconds
  function createAuction(uint duration) external {
    require(auction.owner == address(0), "BlindAuction: auction exists");

    auction = Auction({
      owner: msg.sender,
      highestBid: FHE.asEuint32(0),
      highestBidder: address(0),
      state: AuctionState.BIDDING,
      endTime: block.timestamp + duration,
      finalized: false
    });

    emit AuctionCreated(msg.sender, auction.endTime);
  }

  /// @notice Place encrypted bid
  /// @param encryptedBid Encrypted bid amount
  /// @param inputProof Zero-knowledge proof
  /// @dev ✅ ADVANCED PATTERN: Privacy-preserving bidding
  ///      - Bids encrypted, others can't see amounts
  ///      - Can bid any amount without revealing
  ///      - Only winner revealed after auction ends
  function placeBid(externalEuint32 encryptedBid, bytes calldata inputProof) external {
    require(
      auction.state == AuctionState.BIDDING,
      "BlindAuction: auction not in bidding state"
    );
    require(block.timestamp < auction.endTime, "BlindAuction: bidding ended");
    require(!hasBid[msg.sender], "BlindAuction: already bid");

    // Convert encrypted bid
    euint32 bid = FHE.fromExternal(encryptedBid, inputProof);

    // Store encrypted bid
    bids[msg.sender] = bid;
    hasBid[msg.sender] = true;

    // Grant permissions
    FHE.allowThis(bids[msg.sender]);
    FHE.allow(bids[msg.sender], msg.sender);

    emit BidPlaced(msg.sender);
  }

  /// @notice Compare encrypted bids
  /// @param bidder1 First bidder address
  /// @param bidder2 Second bidder address
  /// @return Boolean indicating if bidder1 has higher bid
  /// @dev ✅ ENCRYPTED COMPARISON: Compare without decrypting
  ///      - Compares encrypted bids directly
  ///      - No one learns actual bid amounts
  ///      - Contract tracks highest encrypted
  function isHigherBid(address bidder1, address bidder2) external view returns (bool) {
    require(hasBid[bidder1] && hasBid[bidder2], "BlindAuction: invalid bidders");

    // Compare encrypted bids
    return FHE.gt(bids[bidder1], bids[bidder2]);
  }

  /// @notice Update highest bid
  /// @param bidder Address of bidder with potentially highest bid
  /// @dev ✅ PATTERN: Update encrypted state
  ///      - Compare new bid to current highest
  ///      - Update if higher (on encrypted data)
  function updateHighestBid(address bidder) external {
    require(hasBid[bidder], "BlindAuction: bidder has no bid");
    require(
      auction.state == AuctionState.BIDDING,
      "BlindAuction: not in bidding state"
    );

    // Compare encrypted bids
    bool isBidHigher = FHE.gt(bids[bidder], auction.highestBid);

    // Update if higher (would be done in production)
    // This demonstrates the pattern
    if (isBidHigher) {
      auction.highestBid = bids[bidder];
      auction.highestBidder = bidder;
    }
  }

  /// @notice End bidding phase
  function endBidding() external {
    require(msg.sender == auction.owner, "BlindAuction: only owner");
    require(
      block.timestamp >= auction.endTime,
      "BlindAuction: auction still active"
    );
    require(auction.state == AuctionState.BIDDING, "BlindAuction: not in bidding");

    auction.state = AuctionState.REVEAL;
  }

  /// @notice Reveal winning bid
  /// @param decryptedAmount Decrypted winning bid amount
  /// @dev ✅ PATTERN: Reveal only winner after auction ends
  ///      - Auction ends, bids still encrypted
  ///      - Winner's bid decrypted
  ///      - Other bids remain private
  function revealWinner(uint32 decryptedAmount) external {
    require(msg.sender == auction.owner, "BlindAuction: only owner");
    require(auction.state == AuctionState.REVEAL, "BlindAuction: not in reveal");
    require(!auction.finalized, "BlindAuction: already finalized");

    // In production, would verify decrypted amount matches encrypted
    // For now, demonstrate the pattern

    auction.finalized = true;
    auction.state = AuctionState.ENDED;

    emit AuctionRevealed(auction.highestBidder, decryptedAmount);
  }

  /// @notice Get current highest bid (encrypted)
  /// @return Encrypted highest bid value
  function getHighestBid() external view returns (euint32) {
    return auction.highestBid;
  }

  /// @notice Get auction state
  /// @return Current auction state
  function getAuctionState() external view returns (AuctionState) {
    return auction.state;
  }

  /// @notice Get highest bidder
  /// @return Address of highest bidder
  function getHighestBidder() external view returns (address) {
    return auction.highestBidder;
  }

  /// @notice Check if user has bid
  /// @param bidder Address to check
  /// @return Boolean indicating if user has bid
  function hasBidded(address bidder) external view returns (bool) {
    return hasBid[bidder];
  }

  /// @notice Get user's encrypted bid
  /// @return Encrypted bid amount
  function getEncryptedBid() external view returns (euint32) {
    require(hasBid[msg.sender], "BlindAuction: no bid found");
    return bids[msg.sender];
  }
}
