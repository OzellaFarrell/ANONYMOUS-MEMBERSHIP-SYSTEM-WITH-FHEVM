// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ConfidentialERC20
/// @notice Privacy-preserving ERC20-like token using FHEVM
/// @dev Demonstrates encrypted token balances and transfers
/// @dev Based on ERC7984 confidential token standard concepts
contract ConfidentialERC20 is ZamaEthereumConfig {
  /// @notice Token metadata
  string public name;
  string public symbol;
  uint8 public decimals;

  /// @notice Encrypted balances
  mapping(address => euint32) private balances;

  /// @notice Encrypted allowances
  mapping(address => mapping(address => euint32)) private allowances;

  /// @notice Events (amount is encrypted, not revealed in event)
  event Transfer(address indexed from, address indexed to);
  event Approval(address indexed owner, address indexed spender);
  event Mint(address indexed to);
  event Burn(address indexed from);

  /// @notice Initialize confidential token
  /// @param _name Token name
  /// @param _symbol Token symbol
  /// @param _decimals Token decimals
  constructor(string memory _name, string memory _symbol, uint8 _decimals) {
    name = _name;
    symbol = _symbol;
    decimals = _decimals;
  }

  /// @notice Get encrypted balance of account
  /// @param account Address to query
  /// @return Encrypted balance
  function balanceOf(address account) external view returns (euint32) {
    return balances[account];
  }

  /// @notice Transfer encrypted amount to recipient
  /// @param to Recipient address
  /// @param encryptedAmount Encrypted transfer amount
  /// @param inputProof Zero-knowledge proof
  /// @dev ✅ PRIVACY PATTERN: Transfer without revealing amount
  ///      - Amount encrypted throughout transfer
  ///      - Only sender/receiver can decrypt their balances
  ///      - Transfer amount never revealed publicly
  function transfer(address to, externalEuint32 encryptedAmount, bytes calldata inputProof)
    external
    returns (bool)
  {
    require(to != address(0), "ConfidentialERC20: transfer to zero address");

    // Convert encrypted amount
    euint32 amount = FHE.fromExternal(encryptedAmount, inputProof);

    // ✅ ENCRYPTED SUBTRACTION: Deduct from sender
    balances[msg.sender] = FHE.sub(balances[msg.sender], amount);

    // ✅ ENCRYPTED ADDITION: Add to recipient
    balances[to] = FHE.add(balances[to], amount);

    // Grant permissions for updated balances
    FHE.allowThis(balances[msg.sender]);
    FHE.allow(balances[msg.sender], msg.sender);

    FHE.allowThis(balances[to]);
    FHE.allow(balances[to], to);

    emit Transfer(msg.sender, to);
    return true;
  }

  /// @notice Approve spender to transfer encrypted amount
  /// @param spender Address authorized to spend
  /// @param encryptedAmount Encrypted allowance amount
  /// @param inputProof Zero-knowledge proof
  function approve(address spender, externalEuint32 encryptedAmount, bytes calldata inputProof)
    external
    returns (bool)
  {
    require(spender != address(0), "ConfidentialERC20: approve zero address");

    // Convert encrypted amount
    euint32 amount = FHE.fromExternal(encryptedAmount, inputProof);

    // Set encrypted allowance
    allowances[msg.sender][spender] = amount;

    // Grant permissions
    FHE.allowThis(allowances[msg.sender][spender]);
    FHE.allow(allowances[msg.sender][spender], msg.sender);
    FHE.allow(allowances[msg.sender][spender], spender);

    emit Approval(msg.sender, spender);
    return true;
  }

  /// @notice Transfer from one account to another using allowance
  /// @param from Source address
  /// @param to Destination address
  /// @param encryptedAmount Encrypted transfer amount
  /// @param inputProof Zero-knowledge proof
  function transferFrom(
    address from,
    address to,
    externalEuint32 encryptedAmount,
    bytes calldata inputProof
  ) external returns (bool) {
    require(from != address(0), "ConfidentialERC20: transfer from zero");
    require(to != address(0), "ConfidentialERC20: transfer to zero");

    // Convert encrypted amount
    euint32 amount = FHE.fromExternal(encryptedAmount, inputProof);

    // ✅ ENCRYPTED OPERATIONS: Update allowance, balances
    // Deduct from allowance
    allowances[from][msg.sender] = FHE.sub(allowances[from][msg.sender], amount);

    // Deduct from sender
    balances[from] = FHE.sub(balances[from], amount);

    // Add to recipient
    balances[to] = FHE.add(balances[to], amount);

    // Grant permissions
    FHE.allowThis(allowances[from][msg.sender]);
    FHE.allow(allowances[from][msg.sender], from);
    FHE.allow(allowances[from][msg.sender], msg.sender);

    FHE.allowThis(balances[from]);
    FHE.allow(balances[from], from);

    FHE.allowThis(balances[to]);
    FHE.allow(balances[to], to);

    emit Transfer(from, to);
    return true;
  }

  /// @notice Get encrypted allowance
  /// @param owner Token owner
  /// @param spender Authorized spender
  /// @return Encrypted allowance amount
  function allowance(address owner, address spender) external view returns (euint32) {
    return allowances[owner][spender];
  }

  /// @notice Mint encrypted amount to account
  /// @param to Recipient address
  /// @param encryptedAmount Encrypted mint amount
  /// @param inputProof Zero-knowledge proof
  /// @dev Only for demonstration - add access control in production
  function mint(address to, externalEuint32 encryptedAmount, bytes calldata inputProof)
    external
  {
    require(to != address(0), "ConfidentialERC20: mint to zero address");

    // Convert encrypted amount
    euint32 amount = FHE.fromExternal(encryptedAmount, inputProof);

    // Add to balance
    balances[to] = FHE.add(balances[to], amount);

    // Grant permissions
    FHE.allowThis(balances[to]);
    FHE.allow(balances[to], to);

    emit Mint(to);
  }

  /// @notice Burn encrypted amount from caller's balance
  /// @param encryptedAmount Encrypted burn amount
  /// @param inputProof Zero-knowledge proof
  function burn(externalEuint32 encryptedAmount, bytes calldata inputProof) external {
    // Convert encrypted amount
    euint32 amount = FHE.fromExternal(encryptedAmount, inputProof);

    // Subtract from balance
    balances[msg.sender] = FHE.sub(balances[msg.sender], amount);

    // Grant permissions
    FHE.allowThis(balances[msg.sender]);
    FHE.allow(balances[msg.sender], msg.sender);

    emit Burn(msg.sender);
  }

  /// @notice Increase allowance
  /// @param spender Address to increase allowance for
  /// @param encryptedAddedValue Encrypted amount to add to allowance
  /// @param inputProof Zero-knowledge proof
  function increaseAllowance(
    address spender,
    externalEuint32 encryptedAddedValue,
    bytes calldata inputProof
  ) external returns (bool) {
    require(spender != address(0), "ConfidentialERC20: increase allowance for zero");

    // Convert encrypted amount
    euint32 addedValue = FHE.fromExternal(encryptedAddedValue, inputProof);

    // Increase allowance
    allowances[msg.sender][spender] = FHE.add(
      allowances[msg.sender][spender],
      addedValue
    );

    // Grant permissions
    FHE.allowThis(allowances[msg.sender][spender]);
    FHE.allow(allowances[msg.sender][spender], msg.sender);
    FHE.allow(allowances[msg.sender][spender], spender);

    emit Approval(msg.sender, spender);
    return true;
  }

  /// @notice Decrease allowance
  /// @param spender Address to decrease allowance for
  /// @param encryptedSubtractedValue Encrypted amount to subtract from allowance
  /// @param inputProof Zero-knowledge proof
  function decreaseAllowance(
    address spender,
    externalEuint32 encryptedSubtractedValue,
    bytes calldata inputProof
  ) external returns (bool) {
    require(spender != address(0), "ConfidentialERC20: decrease allowance for zero");

    // Convert encrypted amount
    euint32 subtractedValue = FHE.fromExternal(encryptedSubtractedValue, inputProof);

    // Decrease allowance
    allowances[msg.sender][spender] = FHE.sub(
      allowances[msg.sender][spender],
      subtractedValue
    );

    // Grant permissions
    FHE.allowThis(allowances[msg.sender][spender]);
    FHE.allow(allowances[msg.sender][spender], msg.sender);
    FHE.allow(allowances[msg.sender][spender], spender);

    emit Approval(msg.sender, spender);
    return true;
  }
}
