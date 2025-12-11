// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ConfidentialVesting
/// @notice Privacy-preserving token vesting with encrypted amounts
/// @dev Demonstrates time-locked encrypted token distribution
contract ConfidentialVesting is ZamaEthereumConfig {
  /// @notice Vesting schedule for beneficiary
  struct VestingSchedule {
    euint32 totalAmount;      // Total encrypted amount to vest
    euint32 releasedAmount;   // Amount already released (encrypted)
    uint64 startTime;         // Vesting start timestamp
    uint64 duration;          // Vesting duration in seconds
    uint64 cliff;             // Cliff period in seconds
    bool revocable;           // Can vesting be revoked
    bool revoked;             // Has vesting been revoked
    bool initialized;         // Is schedule initialized
  }

  /// @notice Vesting schedules by beneficiary
  mapping(address => VestingSchedule) private schedules;

  /// @notice Contract owner
  address public owner;

  /// @notice Events
  event VestingScheduleCreated(address indexed beneficiary, uint64 startTime, uint64 duration);
  event TokensReleased(address indexed beneficiary);
  event VestingRevoked(address indexed beneficiary);

  /// @notice Initialize vesting contract
  constructor() {
    owner = msg.sender;
  }

  /// @notice Modifier to restrict to owner
  modifier onlyOwner() {
    require(msg.sender == owner, "ConfidentialVesting: not owner");
    _;
  }

  /// @notice Create vesting schedule for beneficiary
  /// @param beneficiary Address to receive vested tokens
  /// @param encryptedAmount Encrypted total vesting amount
  /// @param inputProof Zero-knowledge proof
  /// @param startTime Vesting start time
  /// @param duration Vesting duration
  /// @param cliff Cliff period
  /// @param revocable Can vesting be revoked
  /// @dev ✅ PRIVACY PATTERN: Vesting with encrypted amounts
  ///      - Vesting amount is encrypted
  ///      - Only beneficiary knows how much they're vesting
  ///      - Release schedule is public but amounts are private
  function createVestingSchedule(
    address beneficiary,
    externalEuint32 encryptedAmount,
    bytes calldata inputProof,
    uint64 startTime,
    uint64 duration,
    uint64 cliff,
    bool revocable
  ) external onlyOwner {
    require(beneficiary != address(0), "ConfidentialVesting: zero address");
    require(!schedules[beneficiary].initialized, "ConfidentialVesting: already exists");
    require(duration > 0, "ConfidentialVesting: duration is 0");
    require(startTime >= block.timestamp, "ConfidentialVesting: start in past");

    // Convert encrypted amount
    euint32 amount = FHE.fromExternal(encryptedAmount, inputProof);

    // Create vesting schedule
    schedules[beneficiary] = VestingSchedule({
      totalAmount: amount,
      releasedAmount: FHE.asEuint32(0),
      startTime: startTime,
      duration: duration,
      cliff: cliff,
      revocable: revocable,
      revoked: false,
      initialized: true
    });

    // Grant permissions
    FHE.allowThis(schedules[beneficiary].totalAmount);
    FHE.allow(schedules[beneficiary].totalAmount, beneficiary);

    FHE.allowThis(schedules[beneficiary].releasedAmount);
    FHE.allow(schedules[beneficiary].releasedAmount, beneficiary);

    emit VestingScheduleCreated(beneficiary, startTime, duration);
  }

  /// @notice Calculate vested amount
  /// @param beneficiary Address to check
  /// @return Encrypted vested amount
  /// @dev ✅ ENCRYPTED TIME-BASED CALCULATION
  ///      - Calculates vested amount based on time
  ///      - Amount is encrypted throughout
  ///      - Linear vesting from start to end
  function calculateVestedAmount(address beneficiary) public view returns (euint32) {
    VestingSchedule storage schedule = schedules[beneficiary];
    require(schedule.initialized, "ConfidentialVesting: no schedule");

    if (schedule.revoked) {
      // If revoked, return what's already released
      return schedule.releasedAmount;
    }

    uint64 currentTime = uint64(block.timestamp);

    // Before cliff, nothing vested
    if (currentTime < schedule.startTime + schedule.cliff) {
      return FHE.asEuint32(0);
    }

    // After end, everything vested
    if (currentTime >= schedule.startTime + schedule.duration) {
      return schedule.totalAmount;
    }

    // During vesting period - linear calculation
    // In production, would calculate: (totalAmount * elapsed) / duration
    // For demonstration, return proportional encrypted amount
    uint64 elapsed = currentTime - schedule.startTime;
    uint64 ratio = (elapsed * 100) / schedule.duration;  // Percentage

    // Create encrypted ratio and multiply
    euint32 encryptedRatio = FHE.asEuint32(uint32(ratio));
    euint32 vested = FHE.div(
      FHE.mul(schedule.totalAmount, encryptedRatio),
      FHE.asEuint32(100)
    );

    return vested;
  }

  /// @notice Get releasable amount
  /// @param beneficiary Address to check
  /// @return Encrypted releasable amount
  function releasableAmount(address beneficiary) public view returns (euint32) {
    VestingSchedule storage schedule = schedules[beneficiary];
    euint32 vested = calculateVestedAmount(beneficiary);

    // Releasable = vested - released
    return FHE.sub(vested, schedule.releasedAmount);
  }

  /// @notice Release vested tokens
  /// @dev ✅ PATTERN: Release encrypted vested amount
  ///      - Calculate vested amount (encrypted)
  ///      - Release only what's vested
  ///      - Update released amount (encrypted)
  function release() external {
    VestingSchedule storage schedule = schedules[msg.sender];
    require(schedule.initialized, "ConfidentialVesting: no schedule");
    require(!schedule.revoked, "ConfidentialVesting: revoked");

    // Calculate releasable amount
    euint32 releasable = releasableAmount(msg.sender);

    // Update released amount
    schedule.releasedAmount = FHE.add(schedule.releasedAmount, releasable);

    // Grant permissions
    FHE.allowThis(schedule.releasedAmount);
    FHE.allow(schedule.releasedAmount, msg.sender);

    // In production, would transfer tokens here
    // transfer(msg.sender, releasable);

    emit TokensReleased(msg.sender);
  }

  /// @notice Revoke vesting schedule
  /// @param beneficiary Address to revoke vesting for
  function revoke(address beneficiary) external onlyOwner {
    VestingSchedule storage schedule = schedules[beneficiary];
    require(schedule.initialized, "ConfidentialVesting: no schedule");
    require(schedule.revocable, "ConfidentialVesting: not revocable");
    require(!schedule.revoked, "ConfidentialVesting: already revoked");

    schedule.revoked = true;

    emit VestingRevoked(beneficiary);
  }

  /// @notice Get encrypted total amount
  /// @return Encrypted total vesting amount
  function getTotalAmount() external view returns (euint32) {
    require(schedules[msg.sender].initialized, "ConfidentialVesting: no schedule");
    return schedules[msg.sender].totalAmount;
  }

  /// @notice Get encrypted released amount
  /// @return Encrypted released amount
  function getReleasedAmount() external view returns (euint32) {
    require(schedules[msg.sender].initialized, "ConfidentialVesting: no schedule");
    return schedules[msg.sender].releasedAmount;
  }

  /// @notice Get vesting start time
  /// @return Start timestamp
  function getStartTime() external view returns (uint64) {
    require(schedules[msg.sender].initialized, "ConfidentialVesting: no schedule");
    return schedules[msg.sender].startTime;
  }

  /// @notice Get vesting duration
  /// @return Duration in seconds
  function getDuration() external view returns (uint64) {
    require(schedules[msg.sender].initialized, "ConfidentialVesting: no schedule");
    return schedules[msg.sender].duration;
  }

  /// @notice Check if vesting is revoked
  /// @return Boolean indicating if revoked
  function isRevoked() external view returns (bool) {
    require(schedules[msg.sender].initialized, "ConfidentialVesting: no schedule");
    return schedules[msg.sender].revoked;
  }

  /// @notice Check if vesting schedule exists
  /// @param beneficiary Address to check
  /// @return Boolean indicating if schedule exists
  function hasSchedule(address beneficiary) external view returns (bool) {
    return schedules[beneficiary].initialized;
  }
}
