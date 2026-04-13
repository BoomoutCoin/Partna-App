// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import {SusuPool} from "./SusuPool.sol";

/// @title PoolFactory — deploys SusuPool circles with TVL + sizing guardrails.
/// @notice UUPS upgradeable per spec. Admin keys must be held by a Gnosis Safe
///         3-of-5 multisig on mainnet (pre-launch checklist P0).
///
/// @dev    ⚠️  PRE-AUDIT DRAFT. MUST be audited (Certik or Trail of Bits)
///         before any mainnet deployment.
contract PoolFactory is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    // ---------- Config (immutable after init) ----------

    address public usdc;
    address public feeRecipient;
    address public vrfCoordinator;
    uint256 public vrfSubscriptionId;
    bytes32 public vrfKeyHash;

    // ---------- Guardrails (per spec) ----------

    /// @notice Minimum contribution: 10 USDC (10 × 10^6).
    uint256 public constant MIN_CONTRIBUTION = 10 * 1e6;

    /// @notice Maximum contribution: 10_000 USDC.
    uint256 public constant MAX_CONTRIBUTION = 10_000 * 1e6;

    /// @notice Minimum members per pool.
    uint8 public constant MIN_MEMBERS = 3;

    /// @notice Maximum members per pool.
    uint8 public constant MAX_MEMBERS = 20;

    /// @notice Per-pool TVL cap: 50_000 USDC. TVL = numMembers × deposit = numMembers × 2 × contribution.
    uint256 public constant MAX_POOL_TVL = 50_000 * 1e6;

    /// @notice Minimum cycle interval: 1 day.
    uint256 public constant MIN_INTERVAL = 1 days;

    /// @notice Maximum cycle interval: 90 days.
    uint256 public constant MAX_INTERVAL = 90 days;

    // ---------- Registry ----------

    address[] public allPools;
    mapping(address organiser => address[]) public poolsByOrganiser;
    mapping(address pool => bool) public isRegistered;

    // ---------- Events ----------

    event PoolCreated(
        address indexed pool,
        address indexed organiser,
        uint256 contribution,
        uint8 numMembers,
        uint256 intervalSecs
    );

    // ---------- Errors ----------

    error ContributionOutOfRange();
    error MembersOutOfRange();
    error IntervalOutOfRange();
    error TvlCapExceeded();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _owner,
        address _usdc,
        address _feeRecipient,
        address _vrfCoordinator,
        uint256 _vrfSubscriptionId,
        bytes32 _vrfKeyHash
    ) external initializer {
        __Ownable_init(_owner);
        __UUPSUpgradeable_init();

        usdc = _usdc;
        feeRecipient = _feeRecipient;
        vrfCoordinator = _vrfCoordinator;
        vrfSubscriptionId = _vrfSubscriptionId;
        vrfKeyHash = _vrfKeyHash;
    }

    /// @notice Deploy a new SusuPool with validated parameters.
    /// @dev    The caller becomes the pool's organiser. The returned pool is
    ///         in FILLING state — members (including the organiser if they
    ///         wish) must call `join()` separately.
    function createPool(uint256 contribution, uint8 numMembers, uint256 intervalSecs)
        external
        returns (address pool)
    {
        if (contribution < MIN_CONTRIBUTION || contribution > MAX_CONTRIBUTION) {
            revert ContributionOutOfRange();
        }
        if (numMembers < MIN_MEMBERS || numMembers > MAX_MEMBERS) {
            revert MembersOutOfRange();
        }
        if (intervalSecs < MIN_INTERVAL || intervalSecs > MAX_INTERVAL) {
            revert IntervalOutOfRange();
        }

        // TVL = numMembers * 2 * contribution (every member locks 2x as deposit)
        uint256 tvl = uint256(numMembers) * 2 * contribution;
        if (tvl > MAX_POOL_TVL) revert TvlCapExceeded();

        pool = address(
            new SusuPool(
                usdc,
                contribution,
                numMembers,
                intervalSecs,
                msg.sender,
                feeRecipient,
                vrfCoordinator,
                vrfSubscriptionId,
                vrfKeyHash
            )
        );

        allPools.push(pool);
        poolsByOrganiser[msg.sender].push(pool);
        isRegistered[pool] = true;

        emit PoolCreated(pool, msg.sender, contribution, numMembers, intervalSecs);
    }

    // ---------- Reads ----------

    function allPoolsLength() external view returns (uint256) {
        return allPools.length;
    }

    function poolsOfLength(address organiser) external view returns (uint256) {
        return poolsByOrganiser[organiser].length;
    }

    // ---------- UUPS ----------

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
