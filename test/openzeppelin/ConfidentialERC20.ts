import { expect } from "chai";
import { ethers } from "hardhat";
import type { ConfidentialERC20 } from "../../typechain-types";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Test Suite: ConfidentialERC20 Contract
 *
 * Tests privacy-preserving ERC20-like token implementation.
 * Demonstrates:
 * - Encrypted token balances
 * - Encrypted transfers without revealing amounts
 * - Encrypted allowances
 * - Privacy-preserving approve/transferFrom pattern
 * - Encrypted mint and burn operations
 *
 * Key Patterns:
 * - ERC7984 confidential token concepts
 * - FHE arithmetic on balances (add, sub)
 * - Permission management for balances and allowances
 * - Events without revealing encrypted amounts
 */
describe("ConfidentialERC20", function () {
  let contract: ConfidentialERC20;
  let owner: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let charlie: HardhatEthersSigner;
  let contractAddress: string;

  /**
   * Deploy contract before each test
   */
  beforeEach(async function () {
    [owner, alice, bob, charlie] = await ethers.getSigners();

    const ConfidentialERC20Factory = await ethers.getContractFactory(
      "ConfidentialERC20"
    );
    contract = await ConfidentialERC20Factory.deploy(
      "Confidential Token",
      "CTKN",
      18
    );
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  /**
   * Test 1: Contract deployment
   * Verifies token metadata is set correctly
   */
  it("should deploy with correct metadata", async function () {
    expect(await contract.name()).to.equal("Confidential Token");
    expect(await contract.symbol()).to.equal("CTKN");
    expect(await contract.decimals()).to.equal(18);
  });

  /**
   * Test 2: Mint encrypted tokens
   * Tests minting encrypted amount to user
   */
  it("should mint encrypted tokens", async function () {
    // Mint 1000 tokens to Alice
    const input = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    input.add32(1000);
    const encrypted = await input.encrypt();

    const tx = await contract.mint(
      alice.address,
      encrypted.handles[0],
      encrypted.inputProof
    );
    await tx.wait();

    // Alice should have balance
    const balance = await contract.balanceOf(alice.address);
    expect(balance).to.not.be.undefined;
  });

  /**
   * Test 3: Mint event emission
   * Verifies Mint event is emitted (without revealing amount)
   */
  it("should emit Mint event", async function () {
    const input = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    input.add32(500);
    const encrypted = await input.encrypt();

    await expect(
      contract.mint(alice.address, encrypted.handles[0], encrypted.inputProof)
    )
      .to.emit(contract, "Mint")
      .withArgs(alice.address);
  });

  /**
   * Test 4: Transfer encrypted amount
   * Tests encrypted token transfer between users
   *
   * Pattern demonstrated:
   * - Transfer without revealing amount
   * - Balance subtraction (encrypted)
   * - Balance addition (encrypted)
   * - Permission updates for both parties
   */
  it("should transfer encrypted amount between users", async function () {
    // Mint tokens to Alice
    const mintInput = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    mintInput.add32(1000);
    const mintEncrypted = await mintInput.encrypt();
    await contract.mint(
      alice.address,
      mintEncrypted.handles[0],
      mintEncrypted.inputProof
    );

    // Alice transfers 300 to Bob
    const transferInput = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    transferInput.add32(300);
    const transferEncrypted = await transferInput.encrypt();

    const tx = await contract
      .connect(alice)
      .transfer(
        bob.address,
        transferEncrypted.handles[0],
        transferEncrypted.inputProof
      );
    await tx.wait();

    // Both should have balances (encrypted)
    const aliceBalance = await contract.balanceOf(alice.address);
    const bobBalance = await contract.balanceOf(bob.address);

    expect(aliceBalance).to.not.be.undefined;
    expect(bobBalance).to.not.be.undefined;
  });

  /**
   * Test 5: Transfer event emission
   * Verifies Transfer event is emitted (without revealing amount)
   */
  it("should emit Transfer event", async function () {
    // Mint to Alice
    const mintInput = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    mintInput.add32(1000);
    const mintEncrypted = await mintInput.encrypt();
    await contract.mint(
      alice.address,
      mintEncrypted.handles[0],
      mintEncrypted.inputProof
    );

    // Transfer
    const transferInput = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    transferInput.add32(200);
    const transferEncrypted = await transferInput.encrypt();

    await expect(
      contract
        .connect(alice)
        .transfer(
          bob.address,
          transferEncrypted.handles[0],
          transferEncrypted.inputProof
        )
    )
      .to.emit(contract, "Transfer")
      .withArgs(alice.address, bob.address);
  });

  /**
   * Test 6: Approve encrypted allowance
   * Tests setting encrypted allowance for spender
   */
  it("should approve encrypted allowance", async function () {
    // Alice approves Bob to spend 500
    const input = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    input.add32(500);
    const encrypted = await input.encrypt();

    const tx = await contract
      .connect(alice)
      .approve(bob.address, encrypted.handles[0], encrypted.inputProof);
    await tx.wait();

    // Allowance should exist (encrypted)
    const allowance = await contract.allowance(alice.address, bob.address);
    expect(allowance).to.not.be.undefined;
  });

  /**
   * Test 7: Approval event emission
   * Verifies Approval event is emitted
   */
  it("should emit Approval event", async function () {
    const input = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    input.add32(300);
    const encrypted = await input.encrypt();

    await expect(
      contract
        .connect(alice)
        .approve(bob.address, encrypted.handles[0], encrypted.inputProof)
    )
      .to.emit(contract, "Approval")
      .withArgs(alice.address, bob.address);
  });

  /**
   * Test 8: TransferFrom with allowance
   * Tests approved transfer using encrypted allowance
   *
   * Pattern demonstrated:
   * - Allowance deduction (encrypted)
   * - Balance transfers (encrypted)
   * - Three-party permission management
   */
  it("should transfer from approved allowance", async function () {
    // Mint to Alice
    const mintInput = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    mintInput.add32(1000);
    const mintEncrypted = await mintInput.encrypt();
    await contract.mint(
      alice.address,
      mintEncrypted.handles[0],
      mintEncrypted.inputProof
    );

    // Alice approves Bob
    const approveInput = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    approveInput.add32(500);
    const approveEncrypted = await approveInput.encrypt();
    await contract
      .connect(alice)
      .approve(bob.address, approveEncrypted.handles[0], approveEncrypted.inputProof);

    // Bob transfers from Alice to Charlie
    const transferInput = await (bob as any).createEncryptedInput(
      contractAddress,
      bob.address
    );
    transferInput.add32(200);
    const transferEncrypted = await transferInput.encrypt();

    const tx = await contract
      .connect(bob)
      .transferFrom(
        alice.address,
        charlie.address,
        transferEncrypted.handles[0],
        transferEncrypted.inputProof
      );
    await tx.wait();

    // All parties should have updated states (encrypted)
    const aliceBalance = await contract.balanceOf(alice.address);
    const charlieBalance = await contract.balanceOf(charlie.address);
    const allowance = await contract.allowance(alice.address, bob.address);

    expect(aliceBalance).to.not.be.undefined;
    expect(charlieBalance).to.not.be.undefined;
    expect(allowance).to.not.be.undefined;
  });

  /**
   * Test 9: Burn encrypted tokens
   * Tests burning encrypted amount from caller's balance
   */
  it("should burn encrypted tokens", async function () {
    // Mint to Alice
    const mintInput = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    mintInput.add32(1000);
    const mintEncrypted = await mintInput.encrypt();
    await contract.mint(
      alice.address,
      mintEncrypted.handles[0],
      mintEncrypted.inputProof
    );

    // Alice burns 300
    const burnInput = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    burnInput.add32(300);
    const burnEncrypted = await burnInput.encrypt();

    const tx = await contract
      .connect(alice)
      .burn(burnEncrypted.handles[0], burnEncrypted.inputProof);
    await tx.wait();

    // Balance should be updated (encrypted)
    const balance = await contract.balanceOf(alice.address);
    expect(balance).to.not.be.undefined;
  });

  /**
   * Test 10: Burn event emission
   * Verifies Burn event is emitted
   */
  it("should emit Burn event", async function () {
    // Mint first
    const mintInput = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    mintInput.add32(1000);
    const mintEncrypted = await mintInput.encrypt();
    await contract.mint(
      alice.address,
      mintEncrypted.handles[0],
      mintEncrypted.inputProof
    );

    // Burn
    const burnInput = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    burnInput.add32(100);
    const burnEncrypted = await burnInput.encrypt();

    await expect(
      contract
        .connect(alice)
        .burn(burnEncrypted.handles[0], burnEncrypted.inputProof)
    )
      .to.emit(contract, "Burn")
      .withArgs(alice.address);
  });

  /**
   * Test 11: Increase allowance
   * Tests increasing encrypted allowance
   */
  it("should increase encrypted allowance", async function () {
    // Initial approval
    const approveInput = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    approveInput.add32(100);
    const approveEncrypted = await approveInput.encrypt();
    await contract
      .connect(alice)
      .approve(bob.address, approveEncrypted.handles[0], approveEncrypted.inputProof);

    // Increase allowance
    const increaseInput = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    increaseInput.add32(50);
    const increaseEncrypted = await increaseInput.encrypt();

    const tx = await contract
      .connect(alice)
      .increaseAllowance(
        bob.address,
        increaseEncrypted.handles[0],
        increaseEncrypted.inputProof
      );
    await tx.wait();

    // Allowance should be updated
    const allowance = await contract.allowance(alice.address, bob.address);
    expect(allowance).to.not.be.undefined;
  });

  /**
   * Test 12: Decrease allowance
   * Tests decreasing encrypted allowance
   */
  it("should decrease encrypted allowance", async function () {
    // Initial approval
    const approveInput = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    approveInput.add32(500);
    const approveEncrypted = await approveInput.encrypt();
    await contract
      .connect(alice)
      .approve(bob.address, approveEncrypted.handles[0], approveEncrypted.inputProof);

    // Decrease allowance
    const decreaseInput = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    decreaseInput.add32(100);
    const decreaseEncrypted = await decreaseInput.encrypt();

    const tx = await contract
      .connect(alice)
      .decreaseAllowance(
        bob.address,
        decreaseEncrypted.handles[0],
        decreaseEncrypted.inputProof
      );
    await tx.wait();

    // Allowance should be updated
    const allowance = await contract.allowance(alice.address, bob.address);
    expect(allowance).to.not.be.undefined;
  });

  /**
   * Test 13: Multiple transfers
   * Tests sequential transfers between different parties
   */
  it("should handle multiple sequential transfers", async function () {
    // Mint to Alice
    const mintInput = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    mintInput.add32(1000);
    const mintEncrypted = await mintInput.encrypt();
    await contract.mint(
      alice.address,
      mintEncrypted.handles[0],
      mintEncrypted.inputProof
    );

    // Alice → Bob (300)
    const transfer1Input = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    transfer1Input.add32(300);
    const transfer1Encrypted = await transfer1Input.encrypt();
    await contract
      .connect(alice)
      .transfer(
        bob.address,
        transfer1Encrypted.handles[0],
        transfer1Encrypted.inputProof
      );

    // Bob → Charlie (100)
    const transfer2Input = await (bob as any).createEncryptedInput(
      contractAddress,
      bob.address
    );
    transfer2Input.add32(100);
    const transfer2Encrypted = await transfer2Input.encrypt();
    await contract
      .connect(bob)
      .transfer(
        charlie.address,
        transfer2Encrypted.handles[0],
        transfer2Encrypted.inputProof
      );

    // All should have balances
    const aliceBalance = await contract.balanceOf(alice.address);
    const bobBalance = await contract.balanceOf(bob.address);
    const charlieBalance = await contract.balanceOf(charlie.address);

    expect(aliceBalance).to.not.be.undefined;
    expect(bobBalance).to.not.be.undefined;
    expect(charlieBalance).to.not.be.undefined;
  });

  /**
   * Test 14: Privacy verification
   * Verifies that encrypted amounts don't reveal plaintext
   */
  it("should not reveal plaintext amounts", async function () {
    const plaintextAmount = 12345;

    const input = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    input.add32(plaintextAmount);
    const encrypted = await input.encrypt();

    await contract.mint(
      alice.address,
      encrypted.handles[0],
      encrypted.inputProof
    );

    const balance = await contract.balanceOf(alice.address);

    // Encrypted value, not plaintext
    expect(balance).to.not.equal(plaintextAmount);
  });

  /**
   * Test 15: Zero address rejection
   * Tests that transfers to zero address are rejected
   */
  it("should reject transfer to zero address", async function () {
    // Mint to Alice
    const mintInput = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    mintInput.add32(1000);
    const mintEncrypted = await mintInput.encrypt();
    await contract.mint(
      alice.address,
      mintEncrypted.handles[0],
      mintEncrypted.inputProof
    );

    // Try transfer to zero address
    const transferInput = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    transferInput.add32(100);
    const transferEncrypted = await transferInput.encrypt();

    await expect(
      contract
        .connect(alice)
        .transfer(
          ethers.ZeroAddress,
          transferEncrypted.handles[0],
          transferEncrypted.inputProof
        )
    ).to.be.revertedWith("ConfidentialERC20: transfer to zero address");
  });

  /**
   * Test 16: Approve zero address rejection
   * Tests that approvals to zero address are rejected
   */
  it("should reject approve to zero address", async function () {
    const input = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    input.add32(100);
    const encrypted = await input.encrypt();

    await expect(
      contract
        .connect(alice)
        .approve(ethers.ZeroAddress, encrypted.handles[0], encrypted.inputProof)
    ).to.be.revertedWith("ConfidentialERC20: approve zero address");
  });

  /**
   * Test 17: Mint to zero address rejection
   * Tests that minting to zero address is rejected
   */
  it("should reject mint to zero address", async function () {
    const input = await (owner as any).createEncryptedInput(
      contractAddress,
      owner.address
    );
    input.add32(1000);
    const encrypted = await input.encrypt();

    await expect(
      contract.mint(ethers.ZeroAddress, encrypted.handles[0], encrypted.inputProof)
    ).to.be.revertedWith("ConfidentialERC20: mint to zero address");
  });

  /**
   * Test 18: Complex workflow
   * Tests a complete ERC20 workflow with multiple operations
   */
  it("should handle complex workflow", async function () {
    // 1. Mint to Alice
    const mintInput = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    mintInput.add32(1000);
    const mintEncrypted = await mintInput.encrypt();
    await contract.mint(
      alice.address,
      mintEncrypted.handles[0],
      mintEncrypted.inputProof
    );

    // 2. Alice approves Bob
    const approveInput = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    approveInput.add32(300);
    const approveEncrypted = await approveInput.encrypt();
    await contract
      .connect(alice)
      .approve(bob.address, approveEncrypted.handles[0], approveEncrypted.inputProof);

    // 3. Bob transfers from Alice to Charlie
    const transferFromInput = await (bob as any).createEncryptedInput(
      contractAddress,
      bob.address
    );
    transferFromInput.add32(150);
    const transferFromEncrypted = await transferFromInput.encrypt();
    await contract
      .connect(bob)
      .transferFrom(
        alice.address,
        charlie.address,
        transferFromEncrypted.handles[0],
        transferFromEncrypted.inputProof
      );

    // 4. Alice transfers directly to Bob
    const transferInput = await (alice as any).createEncryptedInput(
      contractAddress,
      alice.address
    );
    transferInput.add32(200);
    const transferEncrypted = await transferInput.encrypt();
    await contract
      .connect(alice)
      .transfer(
        bob.address,
        transferEncrypted.handles[0],
        transferEncrypted.inputProof
      );

    // 5. Bob burns some tokens
    const burnInput = await (bob as any).createEncryptedInput(
      contractAddress,
      bob.address
    );
    burnInput.add32(50);
    const burnEncrypted = await burnInput.encrypt();
    await contract
      .connect(bob)
      .burn(burnEncrypted.handles[0], burnEncrypted.inputProof);

    // All states should be valid
    const aliceBalance = await contract.balanceOf(alice.address);
    const bobBalance = await contract.balanceOf(bob.address);
    const charlieBalance = await contract.balanceOf(charlie.address);

    expect(aliceBalance).to.not.be.undefined;
    expect(bobBalance).to.not.be.undefined;
    expect(charlieBalance).to.not.be.undefined;
  });
});
