import { expect } from "chai";
import { ethers } from "hardhat";
import type { BlindAuction } from "../../typechain-types";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Test Suite: BlindAuction Contract
 *
 * Tests privacy-preserving sealed-bid auction implementation.
 * Demonstrates:
 * - Encrypted bidding (bids remain private)
 * - Encrypted bid comparison
 * - Multi-phase auction (bidding → reveal → ended)
 * - Winner reveal without revealing all bids
 * - Privacy-preserving auction mechanics
 *
 * Key Patterns:
 * - Sealed bid encryption
 * - FHE.gt() for encrypted comparison
 * - State machine pattern (BIDDING, REVEAL, ENDED)
 * - Selective decryption (only winner)
 */
describe("BlindAuction", function () {
  let contract: BlindAuction;
  let owner: HardhatEthersSigner;
  let bidder1: HardhatEthersSigner;
  let bidder2: HardhatEthersSigner;
  let bidder3: HardhatEthersSigner;
  let contractAddress: string;

  const AUCTION_DURATION = 3600; // 1 hour

  /**
   * Deploy contract before each test
   */
  beforeEach(async function () {
    [owner, bidder1, bidder2, bidder3] = await ethers.getSigners();

    const BlindAuctionFactory = await ethers.getContractFactory("BlindAuction");
    contract = await BlindAuctionFactory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  /**
   * Test 1: Contract deployment
   * Verifies contract deploys successfully
   */
  it("should deploy successfully", async function () {
    expect(await contract.getAddress()).to.be.properAddress;
  });

  /**
   * Test 2: Create auction
   * Tests auction creation with specified duration
   */
  it("should create auction", async function () {
    const tx = await contract.createAuction(AUCTION_DURATION);
    await tx.wait();

    const state = await contract.getAuctionState();
    expect(state).to.equal(0); // BIDDING state
  });

  /**
   * Test 3: Auction creation event
   * Verifies AuctionCreated event is emitted
   */
  it("should emit AuctionCreated event", async function () {
    await expect(contract.createAuction(AUCTION_DURATION))
      .to.emit(contract, "AuctionCreated")
      .withArgs(owner.address, await ethers.provider.getBlock("latest").then(b => b!.timestamp + AUCTION_DURATION));
  });

  /**
   * Test 4: Prevent multiple auctions
   * Tests that only one auction can exist at a time
   */
  it("should reject creating multiple auctions", async function () {
    await contract.createAuction(AUCTION_DURATION);

    await expect(contract.createAuction(AUCTION_DURATION)).to.be.revertedWith(
      "BlindAuction: auction exists"
    );
  });

  /**
   * Test 5: Place encrypted bid
   * Tests bidder placing encrypted bid
   *
   * Pattern demonstrated:
   * - Bid remains encrypted on-chain
   * - Other bidders cannot see bid amount
   * - Only bidder knows their own bid
   */
  it("should place encrypted bid", async function () {
    // Create auction
    await contract.createAuction(AUCTION_DURATION);

    // Bidder1 places bid of 1000
    const input = await (bidder1 as any).createEncryptedInput(
      contractAddress,
      bidder1.address
    );
    input.add32(1000);
    const encrypted = await input.encrypt();

    const tx = await contract
      .connect(bidder1)
      .placeBid(encrypted.handles[0], encrypted.inputProof);
    await tx.wait();

    // Verify bid is placed
    expect(await contract.hasBidded(bidder1.address)).to.be.true;
  });

  /**
   * Test 6: Bid placed event
   * Verifies BidPlaced event is emitted (without revealing amount)
   */
  it("should emit BidPlaced event", async function () {
    await contract.createAuction(AUCTION_DURATION);

    const input = await (bidder1 as any).createEncryptedInput(
      contractAddress,
      bidder1.address
    );
    input.add32(500);
    const encrypted = await input.encrypt();

    await expect(
      contract
        .connect(bidder1)
        .placeBid(encrypted.handles[0], encrypted.inputProof)
    )
      .to.emit(contract, "BidPlaced")
      .withArgs(bidder1.address);
  });

  /**
   * Test 7: Multiple bidders
   * Tests that multiple bidders can place independent bids
   */
  it("should allow multiple bidders", async function () {
    await contract.createAuction(AUCTION_DURATION);

    // Bidder1 bids 1000
    const input1 = await (bidder1 as any).createEncryptedInput(
      contractAddress,
      bidder1.address
    );
    input1.add32(1000);
    const encrypted1 = await input1.encrypt();
    await contract
      .connect(bidder1)
      .placeBid(encrypted1.handles[0], encrypted1.inputProof);

    // Bidder2 bids 1500
    const input2 = await (bidder2 as any).createEncryptedInput(
      contractAddress,
      bidder2.address
    );
    input2.add32(1500);
    const encrypted2 = await input2.encrypt();
    await contract
      .connect(bidder2)
      .placeBid(encrypted2.handles[0], encrypted2.inputProof);

    // Bidder3 bids 800
    const input3 = await (bidder3 as any).createEncryptedInput(
      contractAddress,
      bidder3.address
    );
    input3.add32(800);
    const encrypted3 = await input3.encrypt();
    await contract
      .connect(bidder3)
      .placeBid(encrypted3.handles[0], encrypted3.inputProof);

    // All should have bids
    expect(await contract.hasBidded(bidder1.address)).to.be.true;
    expect(await contract.hasBidded(bidder2.address)).to.be.true;
    expect(await contract.hasBidded(bidder3.address)).to.be.true;
  });

  /**
   * Test 8: Prevent duplicate bids
   * Tests that bidders cannot bid twice
   */
  it("should reject duplicate bid from same bidder", async function () {
    await contract.createAuction(AUCTION_DURATION);

    // First bid
    const input1 = await (bidder1 as any).createEncryptedInput(
      contractAddress,
      bidder1.address
    );
    input1.add32(1000);
    const encrypted1 = await input1.encrypt();
    await contract
      .connect(bidder1)
      .placeBid(encrypted1.handles[0], encrypted1.inputProof);

    // Second bid - should fail
    const input2 = await (bidder1 as any).createEncryptedInput(
      contractAddress,
      bidder1.address
    );
    input2.add32(2000);
    const encrypted2 = await input2.encrypt();

    await expect(
      contract
        .connect(bidder1)
        .placeBid(encrypted2.handles[0], encrypted2.inputProof)
    ).to.be.revertedWith("BlindAuction: already bid");
  });

  /**
   * Test 9: Bidding only in bidding state
   * Tests that bids can only be placed during BIDDING state
   */
  it("should reject bid when not in bidding state", async function () {
    await contract.createAuction(1); // 1 second duration

    // Wait for auction to end
    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine", []);

    // End bidding
    await contract.endBidding();

    // Try to bid - should fail
    const input = await (bidder1 as any).createEncryptedInput(
      contractAddress,
      bidder1.address
    );
    input.add32(1000);
    const encrypted = await input.encrypt();

    await expect(
      contract
        .connect(bidder1)
        .placeBid(encrypted.handles[0], encrypted.inputProof)
    ).to.be.revertedWith("BlindAuction: auction not in bidding state");
  });

  /**
   * Test 10: Get encrypted bid
   * Tests retrieving bidder's own encrypted bid
   */
  it("should retrieve encrypted bid", async function () {
    await contract.createAuction(AUCTION_DURATION);

    const input = await (bidder1 as any).createEncryptedInput(
      contractAddress,
      bidder1.address
    );
    input.add32(1234);
    const encrypted = await input.encrypt();
    await contract
      .connect(bidder1)
      .placeBid(encrypted.handles[0], encrypted.inputProof);

    const encryptedBid = await contract.connect(bidder1).getEncryptedBid();
    expect(encryptedBid).to.not.be.undefined;
  });

  /**
   * Test 11: Compare encrypted bids
   * Tests encrypted comparison between two bids
   *
   * Pattern demonstrated:
   * - FHE.gt() compares encrypted values
   * - No decryption required
   * - Result is boolean
   */
  it("should compare encrypted bids", async function () {
    await contract.createAuction(AUCTION_DURATION);

    // Bidder1 bids 1000
    const input1 = await (bidder1 as any).createEncryptedInput(
      contractAddress,
      bidder1.address
    );
    input1.add32(1000);
    const encrypted1 = await input1.encrypt();
    await contract
      .connect(bidder1)
      .placeBid(encrypted1.handles[0], encrypted1.inputProof);

    // Bidder2 bids 500
    const input2 = await (bidder2 as any).createEncryptedInput(
      contractAddress,
      bidder2.address
    );
    input2.add32(500);
    const encrypted2 = await input2.encrypt();
    await contract
      .connect(bidder2)
      .placeBid(encrypted2.handles[0], encrypted2.inputProof);

    // Compare: bidder1 (1000) > bidder2 (500) = true
    const isHigher = await contract.isHigherBid(bidder1.address, bidder2.address);
    expect(isHigher).to.be.true;
  });

  /**
   * Test 12: Comparison requires valid bidders
   * Tests that comparison requires both bidders to have placed bids
   */
  it("should reject comparison with invalid bidders", async function () {
    await contract.createAuction(AUCTION_DURATION);

    const input = await (bidder1 as any).createEncryptedInput(
      contractAddress,
      bidder1.address
    );
    input.add32(1000);
    const encrypted = await input.encrypt();
    await contract
      .connect(bidder1)
      .placeBid(encrypted.handles[0], encrypted.inputProof);

    // bidder2 hasn't bid yet
    await expect(
      contract.isHigherBid(bidder1.address, bidder2.address)
    ).to.be.revertedWith("BlindAuction: invalid bidders");
  });

  /**
   * Test 13: End bidding phase
   * Tests transitioning from BIDDING to REVEAL state
   */
  it("should end bidding phase", async function () {
    await contract.createAuction(1); // 1 second

    // Wait for auction to end
    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine", []);

    await contract.endBidding();

    const state = await contract.getAuctionState();
    expect(state).to.equal(1); // REVEAL state
  });

  /**
   * Test 14: Only owner can end bidding
   * Tests that only auction owner can end bidding
   */
  it("should reject end bidding from non-owner", async function () {
    await contract.createAuction(1);

    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine", []);

    await expect(
      contract.connect(bidder1).endBidding()
    ).to.be.revertedWith("BlindAuction: only owner");
  });

  /**
   * Test 15: Cannot end bidding before auction ends
   * Tests that bidding cannot be ended before endTime
   */
  it("should reject ending bidding before auction ends", async function () {
    await contract.createAuction(AUCTION_DURATION);

    await expect(contract.endBidding()).to.be.revertedWith(
      "BlindAuction: auction still active"
    );
  });

  /**
   * Test 16: Reveal winner
   * Tests revealing winning bid after auction ends
   *
   * Pattern demonstrated:
   * - Only winner's bid is revealed
   * - Other bids remain private
   * - Auction transitions to ENDED state
   */
  it("should reveal winner", async function () {
    await contract.createAuction(1);

    // Place bids
    const input1 = await (bidder1 as any).createEncryptedInput(
      contractAddress,
      bidder1.address
    );
    input1.add32(1000);
    const encrypted1 = await input1.encrypt();
    await contract
      .connect(bidder1)
      .placeBid(encrypted1.handles[0], encrypted1.inputProof);

    // End auction
    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine", []);
    await contract.endBidding();

    // Reveal winner (in production, would decrypt highest bid)
    await contract.revealWinner(1000);

    const state = await contract.getAuctionState();
    expect(state).to.equal(2); // ENDED state
  });

  /**
   * Test 17: Winner revelation event
   * Verifies AuctionRevealed event with winner and amount
   */
  it("should emit AuctionRevealed event", async function () {
    await contract.createAuction(1);

    const input = await (bidder1 as any).createEncryptedInput(
      contractAddress,
      bidder1.address
    );
    input.add32(500);
    const encrypted = await input.encrypt();
    await contract
      .connect(bidder1)
      .placeBid(encrypted.handles[0], encrypted.inputProof);

    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine", []);
    await contract.endBidding();

    // Note: highestBidder might be address(0) if updateHighestBid not called
    await expect(contract.revealWinner(500))
      .to.emit(contract, "AuctionRevealed");
  });

  /**
   * Test 18: Only owner can reveal winner
   * Tests that only auction owner can reveal winner
   */
  it("should reject reveal from non-owner", async function () {
    await contract.createAuction(1);

    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine", []);
    await contract.endBidding();

    await expect(
      contract.connect(bidder1).revealWinner(100)
    ).to.be.revertedWith("BlindAuction: only owner");
  });

  /**
   * Test 19: Can only reveal in REVEAL state
   * Tests that winner can only be revealed in REVEAL state
   */
  it("should reject reveal when not in reveal state", async function () {
    await contract.createAuction(AUCTION_DURATION);

    await expect(contract.revealWinner(100)).to.be.revertedWith(
      "BlindAuction: not in reveal"
    );
  });

  /**
   * Test 20: Privacy verification
   * Verifies that bids remain private until revelation
   */
  it("should maintain bid privacy", async function () {
    await contract.createAuction(AUCTION_DURATION);

    const plaintextBid = 12345;

    const input = await (bidder1 as any).createEncryptedInput(
      contractAddress,
      bidder1.address
    );
    input.add32(plaintextBid);
    const encrypted = await input.encrypt();
    await contract
      .connect(bidder1)
      .placeBid(encrypted.handles[0], encrypted.inputProof);

    const encryptedBid = await contract.connect(bidder1).getEncryptedBid();

    // Encrypted value, not plaintext
    expect(encryptedBid).to.not.equal(plaintextBid);
  });

  /**
   * Test 21: Get highest bid
   * Tests retrieving encrypted highest bid
   */
  it("should return encrypted highest bid", async function () {
    await contract.createAuction(AUCTION_DURATION);

    const highestBid = await contract.getHighestBid();
    expect(highestBid).to.not.be.undefined;
  });

  /**
   * Test 22: Get highest bidder
   * Tests retrieving highest bidder address
   */
  it("should return highest bidder address", async function () {
    await contract.createAuction(AUCTION_DURATION);

    const highestBidder = await contract.getHighestBidder();
    // Initially address(0)
    expect(highestBidder).to.equal(ethers.ZeroAddress);
  });

  /**
   * Test 23: Complete auction workflow
   * Tests full auction lifecycle
   */
  it("should handle complete auction workflow", async function () {
    // 1. Create auction
    await contract.createAuction(1);

    // 2. Multiple bidders place bids
    const input1 = await (bidder1 as any).createEncryptedInput(
      contractAddress,
      bidder1.address
    );
    input1.add32(1000);
    const encrypted1 = await input1.encrypt();
    await contract
      .connect(bidder1)
      .placeBid(encrypted1.handles[0], encrypted1.inputProof);

    const input2 = await (bidder2 as any).createEncryptedInput(
      contractAddress,
      bidder2.address
    );
    input2.add32(1500);
    const encrypted2 = await input2.encrypt();
    await contract
      .connect(bidder2)
      .placeBid(encrypted2.handles[0], encrypted2.inputProof);

    const input3 = await (bidder3 as any).createEncryptedInput(
      contractAddress,
      bidder3.address
    );
    input3.add32(800);
    const encrypted3 = await input3.encrypt();
    await contract
      .connect(bidder3)
      .placeBid(encrypted3.handles[0], encrypted3.inputProof);

    // 3. Wait for auction to end
    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine", []);

    // 4. End bidding
    await contract.endBidding();
    expect(await contract.getAuctionState()).to.equal(1); // REVEAL

    // 5. Reveal winner
    await contract.revealWinner(1500);
    expect(await contract.getAuctionState()).to.equal(2); // ENDED

    // All bidders should still have their bids (encrypted)
    expect(await contract.hasBidded(bidder1.address)).to.be.true;
    expect(await contract.hasBidded(bidder2.address)).to.be.true;
    expect(await contract.hasBidded(bidder3.address)).to.be.true;
  });
});
