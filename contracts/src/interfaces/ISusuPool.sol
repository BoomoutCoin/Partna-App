// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title ISusuPool — public surface of a SusuPool pool
/// @notice Referenced by PoolFactory and off-chain tooling (subgraph, API).
interface ISusuPool {
    enum PoolStatus { FILLING, ACTIVE, COMPLETED }

    // ---------- Events ----------
    event MemberJoined(address indexed member, uint256 depositAmount);
    event PoolActivated(uint256 startTime);
    event RotationSet(address[] order);
    event ContributionReceived(address indexed member, uint256 indexed cycle, uint256 amount);
    event PayoutExecuted(address indexed recipient, uint256 indexed cycle, uint256 amount, uint256 fee);
    event MemberSlashed(address indexed member, uint256 indexed cycle, uint256 slashAmount);
    event PoolCompleted(uint256 finalCycle);
    event DepositReturned(address indexed member, uint256 amount);

    // ---------- Writes ----------
    function join() external;
    function contribute() external;

    // ---------- Reads ----------
    function status() external view returns (PoolStatus);
    function contribution() external view returns (uint256);
    function depositAmount() external view returns (uint256);
    function numMembers() external view returns (uint8);
    function intervalSeconds() external view returns (uint256);
    function organiser() external view returns (address);
    function currentCycle() external view returns (uint256);
    function cycleDeadline() external view returns (uint256);
    function membersCount() external view returns (uint256);
    function memberAt(uint256 index) external view returns (address);
}
