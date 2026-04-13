// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import {AutomationCompatibleInterface} from
    "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";

import {ISusuPool} from "./interfaces/ISusuPool.sol";

/// @title SusuPool — a single rotating-savings (susu) circle
/// @notice Members lock a 2× contribution deposit and take turns receiving the
///         pot each cycle. Contributions are pulled automatically by
///         `contribute()`; non-payers are slashed by Chainlink Automation after
///         a 24h grace period. The security deposit stays locked even after a
///         member has received their payout — this is the key retention
///         mechanism that solves the post-payout dropout failure mode of
///         traditional susu.
///
/// @dev ⚠️  PRE-AUDIT DRAFT. MUST be audited (Certik or Trail of Bits) before
///      any mainnet deployment. See CLAUDE.md pre-launch checklist.
///
///      Inheritance order matters: `VRFConsumerBaseV2Plus` contributes
///      `ConfirmedOwner` which gives us `onlyOwner`, used for pause / unpause.
contract SusuPool is
    ISusuPool,
    ReentrancyGuard,
    Pausable,
    VRFConsumerBaseV2Plus,
    AutomationCompatibleInterface
{
    using SafeERC20 for IERC20;

    // ---------- Immutable config ----------
    IERC20 public immutable usdc;
    uint256 public immutable contributionAmount;
    uint256 public immutable depositAmountImm;
    uint8 public immutable numMembersImm;
    uint256 public immutable intervalSecondsImm;
    address public immutable organiserAddr;
    address public immutable feeRecipient;

    uint16 public constant FEE_BPS = 50;           // 0.5%
    uint256 public constant GRACE_PERIOD = 24 hours;

    // ---------- VRF config ----------
    uint256 public immutable vrfSubscriptionId;
    bytes32 public immutable vrfKeyHash;
    uint32 public constant VRF_CALLBACK_GAS_LIMIT = 500_000;
    uint16 public constant VRF_REQUEST_CONFIRMATIONS = 3;

    // ---------- Mutable state ----------
    PoolStatus public statusVar;
    address[] public membersList;
    address[] public rotationOrder;
    mapping(address => Member) public members;

    /// @notice 1-indexed cycle counter; 0 while FILLING.
    uint256 public currentCycleVar;
    uint256 public cycleDeadlineVar;

    /// @notice Running pot for the current cycle (contributions paid so far).
    uint256 public currentPot;

    /// @notice Per-member remaining deposit balance. Seeded at `depositAmountImm`
    ///         on join, reduced by `contributionAmount` on each slash event
    ///         (slashed deposit covers the missed contribution).
    mapping(address => uint256) public depositBalance;

    uint256 public vrfRequestId;

    struct Member {
        bool exists;
        bool slashed;
        bool paidThisCycle;
        bool hasReceivedPayout;
        uint8 rotationIndex;
        uint32 onTimeCycles;
        uint32 totalCycles;
        uint256 joinedAt;
    }

    // ---------- Errors ----------
    error NotFilling();
    error NotActive();
    error AlreadyMember();
    error PoolFull();
    error NotMember();
    error AlreadyPaidThisCycle();
    error MemberIsSlashed();
    error GracePeriodNotElapsed();
    error BadVrfRequest();

    constructor(
        address _usdc,
        uint256 _contribution,
        uint8 _numMembers,
        uint256 _intervalSeconds,
        address _organiser,
        address _feeRecipient,
        address _vrfCoordinator,
        uint256 _vrfSubscriptionId,
        bytes32 _vrfKeyHash
    ) VRFConsumerBaseV2Plus(_vrfCoordinator) {
        usdc = IERC20(_usdc);
        contributionAmount = _contribution;
        depositAmountImm = _contribution * 2;
        numMembersImm = _numMembers;
        intervalSecondsImm = _intervalSeconds;
        organiserAddr = _organiser;
        feeRecipient = _feeRecipient;
        vrfSubscriptionId = _vrfSubscriptionId;
        vrfKeyHash = _vrfKeyHash;
        statusVar = PoolStatus.FILLING;
    }

    // ---------- ISusuPool read surface ----------
    function status() external view override returns (PoolStatus) { return statusVar; }
    function contribution() external view override returns (uint256) { return contributionAmount; }
    function depositAmount() external view override returns (uint256) { return depositAmountImm; }
    function numMembers() external view override returns (uint8) { return numMembersImm; }
    function intervalSeconds() external view override returns (uint256) { return intervalSecondsImm; }
    function organiser() external view override returns (address) { return organiserAddr; }
    function currentCycle() external view override returns (uint256) { return currentCycleVar; }
    function cycleDeadline() external view override returns (uint256) { return cycleDeadlineVar; }
    function membersCount() external view override returns (uint256) { return membersList.length; }
    function memberAt(uint256 i) external view override returns (address) { return membersList[i]; }

    // ---------- Join ----------

    /// @notice Join the pool. Caller must first `approve()` the contract for
    ///         `depositAmount()` USDC. The deposit stays locked until
    ///         `PoolCompleted` (or forfeited on slash).
    function join() external override nonReentrant whenNotPaused {
        if (statusVar != PoolStatus.FILLING) revert NotFilling();
        if (members[msg.sender].exists) revert AlreadyMember();
        if (membersList.length >= numMembersImm) revert PoolFull();

        usdc.safeTransferFrom(msg.sender, address(this), depositAmountImm);

        members[msg.sender] = Member({
            exists: true,
            slashed: false,
            paidThisCycle: false,
            hasReceivedPayout: false,
            rotationIndex: 0,
            onTimeCycles: 0,
            totalCycles: 0,
            joinedAt: block.timestamp
        });
        membersList.push(msg.sender);
        depositBalance[msg.sender] = depositAmountImm;

        emit MemberJoined(msg.sender, depositAmountImm);

        if (membersList.length == numMembersImm) {
            _requestRandomness();
        }
    }

    // ---------- VRF ----------

    function _requestRandomness() internal {
        VRFV2PlusClient.RandomWordsRequest memory req = VRFV2PlusClient.RandomWordsRequest({
            keyHash: vrfKeyHash,
            subId: vrfSubscriptionId,
            requestConfirmations: VRF_REQUEST_CONFIRMATIONS,
            callbackGasLimit: VRF_CALLBACK_GAS_LIMIT,
            numWords: 1,
            extraArgs: VRFV2PlusClient._argsToBytes(
                VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
            )
        });
        vrfRequestId = s_vrfCoordinator.requestRandomWords(req);
    }

    /// @dev Fisher-Yates shuffle over the member list, seeded by the VRF word.
    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        if (requestId != vrfRequestId) revert BadVrfRequest();
        if (statusVar != PoolStatus.FILLING) revert NotFilling();

        address[] memory shuffled = new address[](numMembersImm);
        for (uint8 i = 0; i < numMembersImm; i++) {
            shuffled[i] = membersList[i];
        }

        uint256 seed = randomWords[0];
        for (uint256 i = numMembersImm - 1; i > 0; i--) {
            uint256 j = uint256(keccak256(abi.encode(seed, i))) % (i + 1);
            (shuffled[i], shuffled[j]) = (shuffled[j], shuffled[i]);
        }

        for (uint8 i = 0; i < numMembersImm; i++) {
            rotationOrder.push(shuffled[i]);
            members[shuffled[i]].rotationIndex = i;
        }

        statusVar = PoolStatus.ACTIVE;
        currentCycleVar = 1;
        cycleDeadlineVar = block.timestamp + intervalSecondsImm;

        emit RotationSet(rotationOrder);
        emit PoolActivated(block.timestamp);
    }

    // ---------- Contribute ----------

    function contribute() external override nonReentrant whenNotPaused {
        if (statusVar != PoolStatus.ACTIVE) revert NotActive();
        Member storage m = members[msg.sender];
        if (!m.exists) revert NotMember();
        if (m.slashed) revert MemberIsSlashed();
        if (m.paidThisCycle) revert AlreadyPaidThisCycle();

        usdc.safeTransferFrom(msg.sender, address(this), contributionAmount);
        m.paidThisCycle = true;
        m.onTimeCycles += 1;
        m.totalCycles += 1;
        currentPot += contributionAmount;

        emit ContributionReceived(msg.sender, currentCycleVar, contributionAmount);

        if (_allActivePaid()) {
            _executePayout();
        }
    }

    function _allActivePaid() internal view returns (bool) {
        for (uint256 i = 0; i < rotationOrder.length; i++) {
            Member storage m = members[rotationOrder[i]];
            if (!m.slashed && !m.paidThisCycle) return false;
        }
        return true;
    }

    // ---------- Payout ----------

    function _executePayout() internal {
        address recipient = rotationOrder[currentCycleVar - 1];
        Member storage rm = members[recipient];

        // Recipient was slashed in an earlier cycle — skip their turn.
        // Accumulated pot goes to the fee recipient (forfeited).
        if (rm.slashed) {
            uint256 forfeit = currentPot;
            currentPot = 0;
            if (forfeit > 0) usdc.safeTransfer(feeRecipient, forfeit);
            _advanceCycle();
            return;
        }

        uint256 pot = currentPot;
        uint256 fee = (pot * FEE_BPS) / 10_000;
        uint256 payout = pot - fee;

        rm.hasReceivedPayout = true;
        currentPot = 0;

        // Reset paidThisCycle for non-slashed members ready for next cycle.
        for (uint256 i = 0; i < rotationOrder.length; i++) {
            Member storage im = members[rotationOrder[i]];
            if (!im.slashed) im.paidThisCycle = false;
        }

        if (fee > 0) usdc.safeTransfer(feeRecipient, fee);
        if (payout > 0) usdc.safeTransfer(recipient, payout);

        emit PayoutExecuted(recipient, currentCycleVar, payout, fee);

        _advanceCycle();
    }

    function _advanceCycle() internal {
        if (currentCycleVar >= numMembersImm) {
            _completePool();
        } else {
            currentCycleVar += 1;
            cycleDeadlineVar = block.timestamp + intervalSecondsImm;
        }
    }

    // ---------- Completion ----------

    function _completePool() internal {
        statusVar = PoolStatus.COMPLETED;

        for (uint256 i = 0; i < rotationOrder.length; i++) {
            address m = rotationOrder[i];
            if (!members[m].slashed) {
                uint256 bal = depositBalance[m];
                if (bal > 0) {
                    depositBalance[m] = 0;
                    usdc.safeTransfer(m, bal);
                    emit DepositReturned(m, bal);
                }
            }
        }

        // Sweep any residual (from slashed deposits net of pot contributions) to fee recipient.
        uint256 residual = usdc.balanceOf(address(this));
        if (residual > 0) {
            usdc.safeTransfer(feeRecipient, residual);
        }

        emit PoolCompleted(currentCycleVar);
    }

    // ---------- Chainlink Automation ----------

    /// @notice Upkeep needed when the grace period has elapsed and at least one
    ///         active member hasn't paid this cycle.
    function checkUpkeep(bytes calldata)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        upkeepNeeded = statusVar == PoolStatus.ACTIVE
            && block.timestamp > cycleDeadlineVar + GRACE_PERIOD
            && !_allActivePaid();
        performData = "";
    }

    /// @notice Slash all non-payers, cover the gap from their deposits, then
    ///         execute the cycle's payout.
    function performUpkeep(bytes calldata) external override nonReentrant {
        if (statusVar != PoolStatus.ACTIVE) revert NotActive();
        if (block.timestamp <= cycleDeadlineVar + GRACE_PERIOD) revert GracePeriodNotElapsed();

        for (uint256 i = 0; i < rotationOrder.length; i++) {
            address addr = rotationOrder[i];
            Member storage m = members[addr];
            if (!m.slashed && !m.paidThisCycle) {
                m.slashed = true;
                m.totalCycles += 1;

                // Seize `contributionAmount` from the slashed member's deposit
                // to backfill this cycle's pot. Any residual deposit stays
                // in-contract and is forfeited at `_completePool`.
                uint256 seized = contributionAmount;
                uint256 bal = depositBalance[addr];
                if (seized > bal) seized = bal;
                depositBalance[addr] = bal - seized;
                currentPot += seized;

                emit MemberSlashed(addr, currentCycleVar, seized);
            }
        }

        _executePayout();
    }

    // ---------- Admin ----------

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
