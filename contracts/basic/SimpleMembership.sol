// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, euint8, externalEuint32, externalEuint8 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title SimpleMembership
/// @notice A basic privacy-preserving membership contract
/// @dev Demonstrates encrypted member registration and status tracking
contract SimpleMembership is ZamaEthereumConfig {
  /// @notice Track membership status (plaintext flag)
  mapping(address => bool) private isMemberStatus;

  /// @notice Encrypted membership status
  mapping(address => euint32) private memberStatus;

  /// @notice Plaintext member count for external reference
  uint32 private totalMembersCount;

  /// @notice Events
  event MemberRegistered(address indexed member);
  event MemberStatusUpdated(address indexed member);

  /// @notice Initialize the contract
  constructor() {
    totalMembersCount = 0;
  }

  /// @notice Register a new member with encrypted status
  /// @param encryptedStatus Encrypted membership status (0 = inactive, 1 = active)
  /// @param inputProof Zero-knowledge proof for the encrypted input
  function registerMember(externalEuint32 encryptedStatus, bytes calldata inputProof) external {
    require(!isMemberStatus[msg.sender], "SimpleMembership: already registered");

    // Convert external encrypted value to internal representation
    euint32 status = FHE.fromExternal(encryptedStatus, inputProof);

    // Store encrypted member status
    memberStatus[msg.sender] = status;
    isMemberStatus[msg.sender] = true;

    // Increment total members count
    totalMembersCount++;

    // Grant permissions for the contract and caller
    FHE.allowThis(memberStatus[msg.sender]);
    FHE.allow(memberStatus[msg.sender], msg.sender);

    emit MemberRegistered(msg.sender);
  }

  /// @notice Update member status (encrypted)
  /// @param newStatus Encrypted new status value
  /// @param inputProof Zero-knowledge proof for the encrypted input
  function updateMemberStatus(externalEuint32 newStatus, bytes calldata inputProof) external {
    require(isMemberStatus[msg.sender], "SimpleMembership: not a member");

    // Convert external encrypted value
    euint32 status = FHE.fromExternal(newStatus, inputProof);

    // Update member status
    memberStatus[msg.sender] = status;

    // Grant permissions
    FHE.allowThis(memberStatus[msg.sender]);
    FHE.allow(memberStatus[msg.sender], msg.sender);

    emit MemberStatusUpdated(msg.sender);
  }

  /// @notice Get encrypted member status (only callable by the member)
  /// @return Encrypted member status
  function getMemberStatus() external view returns (euint32) {
    require(isMemberStatus[msg.sender], "SimpleMembership: not a member");
    return memberStatus[msg.sender];
  }

  /// @notice Check if address is a registered member
  /// @return Boolean indicating membership status
  function isMember(address member) external view returns (bool) {
    return isMemberStatus[member];
  }

  /// @notice Get total plaintext member count
  /// @return Total member count
  function getTotalMembers() external view returns (uint32) {
    return totalMembersCount;
  }
}
