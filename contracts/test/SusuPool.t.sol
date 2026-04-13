// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {SusuPool} from "../src/SusuPool.sol";
import {ISusuPool} from "../src/interfaces/ISusuPool.sol";
import {MockUSDC} from "./mocks/MockUSDC.sol";
import {MockVRFCoordinator} from "./mocks/MockVRFCoordinator.sol";

contract SusuPoolTest is Test {
    MockUSDC internal usdc;
    MockVRFCoordinator internal vrf;
    SusuPool internal pool;

    address internal organiser = makeAddr("organiser");
    address internal feeRecipient = makeAddr("feeRecipient");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");

    uint256 internal constant CONTRIBUTION = 100 * 1e6; // 100 USDC
    uint8 internal constant NUM_MEMBERS = 3;
    uint256 internal constant INTERVAL = 7 days;
    uint256 internal constant SUB_ID = 1;
    bytes32 internal constant KEY_HASH = bytes32(uint256(1));

    function setUp() public {
        usdc = new MockUSDC();
        vrf = new MockVRFCoordinator();

        // Deploy SusuPool directly (PoolFactory is exercised in PoolFactory.t.sol).
        vm.prank(organiser);
        pool = new SusuPool(
            address(usdc),
            CONTRIBUTION,
            NUM_MEMBERS,
            INTERVAL,
            organiser,
            feeRecipient,
            address(vrf),
            SUB_ID,
            KEY_HASH
        );

        // Fund participants
        _mintAndApprove(alice, 10_000 * 1e6);
        _mintAndApprove(bob, 10_000 * 1e6);
        _mintAndApprove(carol, 10_000 * 1e6);
    }

    function _mintAndApprove(address who, uint256 amount) internal {
        usdc.mint(who, amount);
        vm.prank(who);
        usdc.approve(address(pool), type(uint256).max);
    }

    function _joinAll() internal {
        vm.prank(alice); pool.join();
        vm.prank(bob); pool.join();
        vm.prank(carol); pool.join();
    }

    /// @dev All three join and VRF fulfils — pool should transition to ACTIVE.
    function _fillAndActivate(uint256 seed) internal {
        _joinAll();
        // requestId is 1 because mock starts at 1
        vrf.fulfill(1, seed);
        assertEq(uint8(pool.status()), uint8(ISusuPool.PoolStatus.ACTIVE));
    }

    // ---------- Happy path ----------

    function test_HappyPath_JoinFillsAndActivates() public {
        _joinAll();
        assertEq(uint8(pool.status()), uint8(ISusuPool.PoolStatus.FILLING));
        assertEq(pool.membersCount(), 3);

        vrf.fulfill(1, 12345);
        assertEq(uint8(pool.status()), uint8(ISusuPool.PoolStatus.ACTIVE));
        assertEq(pool.currentCycle(), 1);
    }

    function test_HappyPath_FullCycleReturnsDeposits() public {
        _fillAndActivate(12345);

        uint256 aliceBefore = usdc.balanceOf(alice);
        uint256 bobBefore = usdc.balanceOf(bob);
        uint256 carolBefore = usdc.balanceOf(carol);
        uint256 feeBefore = usdc.balanceOf(feeRecipient);

        // Three cycles, everyone pays each cycle. Payout auto-fires when pot is full.
        for (uint256 c = 0; c < NUM_MEMBERS; c++) {
            vm.prank(alice); pool.contribute();
            vm.prank(bob); pool.contribute();
            vm.prank(carol); pool.contribute();
        }

        assertEq(uint8(pool.status()), uint8(ISusuPool.PoolStatus.COMPLETED));

        // Net = 0 (every member pays and receives one payout) minus fee share.
        // Deposits return in full for all non-slashed members.
        // Total fee = 3 cycles * pot * 0.5% = 3 * 300e6 * 50 / 10_000 = 4.5e6
        assertEq(usdc.balanceOf(feeRecipient) - feeBefore, 3 * (CONTRIBUTION * NUM_MEMBERS * 50) / 10_000);

        // Per-member delta over the life of the pool, measured from just after `join()`:
        //   - Pays  3 × contribution (every cycle)
        //   - Receives (pot − fee) once (their rotation turn)
        //   - Gets  2 × contribution (deposit) back at completion
        uint256 payout = (CONTRIBUTION * NUM_MEMBERS) - ((CONTRIBUTION * NUM_MEMBERS * 50) / 10_000);
        int256 expectedDelta =
            int256(payout) - int256(3 * CONTRIBUTION) + int256(uint256(2) * CONTRIBUTION);

        assertEq(int256(usdc.balanceOf(alice)) - int256(aliceBefore), expectedDelta);
        assertEq(int256(usdc.balanceOf(bob)) - int256(bobBefore), expectedDelta);
        assertEq(int256(usdc.balanceOf(carol)) - int256(carolBefore), expectedDelta);

        // Contract should be drained.
        assertEq(usdc.balanceOf(address(pool)), 0);
    }

    // ---------- Slash path ----------

    function test_SlashPath_NonPayerLosesDeposit() public {
        _fillAndActivate(12345);

        // Cycle 1: alice + bob pay, carol does not.
        vm.prank(alice); pool.contribute();
        vm.prank(bob); pool.contribute();

        // Grace elapses: 7d interval + 24h grace + 1s.
        vm.warp(block.timestamp + INTERVAL + 24 hours + 1);

        // Anyone can trigger upkeep — Chainlink Automation in prod.
        pool.performUpkeep("");

        // Carol should now be slashed.
        (bool exists, bool slashed,,,,,,) = pool.members(carol);
        assertTrue(exists);
        assertTrue(slashed);

        // We should be in cycle 2 now (or pool complete, depending on rotation).
        assertTrue(
            uint8(pool.status()) == uint8(ISusuPool.PoolStatus.ACTIVE)
                || uint8(pool.status()) == uint8(ISusuPool.PoolStatus.COMPLETED)
        );
    }

    function test_CannotContributeTwiceInOneCycle() public {
        _fillAndActivate(12345);

        vm.prank(alice); pool.contribute();
        vm.prank(alice);
        vm.expectRevert(SusuPool.AlreadyPaidThisCycle.selector);
        pool.contribute();
    }

    function test_CannotJoinWhenFull() public {
        _joinAll();
        address dan = makeAddr("dan");
        _mintAndApprove(dan, 10_000 * 1e6);
        vm.prank(dan);
        vm.expectRevert(SusuPool.PoolFull.selector);
        pool.join();
    }

    function test_CannotJoinAfterActive() public {
        _fillAndActivate(12345);
        address dan = makeAddr("dan");
        _mintAndApprove(dan, 10_000 * 1e6);
        vm.prank(dan);
        vm.expectRevert(SusuPool.NotFilling.selector);
        pool.join();
    }

    function test_NonMemberCannotContribute() public {
        _fillAndActivate(12345);
        address dan = makeAddr("dan");
        _mintAndApprove(dan, 10_000 * 1e6);
        vm.prank(dan);
        vm.expectRevert(SusuPool.NotMember.selector);
        pool.contribute();
    }

    function test_UpkeepRevertsBeforeGrace() public {
        _fillAndActivate(12345);
        vm.warp(block.timestamp + INTERVAL + 1);
        vm.expectRevert(SusuPool.GracePeriodNotElapsed.selector);
        pool.performUpkeep("");
    }

    // ---------- Fuzz ----------

    /// @dev Rotation shuffle should always yield exactly numMembers distinct members.
    function testFuzz_RotationIsPermutation(uint256 seed) public {
        _joinAll();
        vrf.fulfill(1, seed);

        address[] memory seen = new address[](NUM_MEMBERS);
        for (uint8 i = 0; i < NUM_MEMBERS; i++) {
            seen[i] = pool.rotationOrder(i);
        }

        // Every original member must appear exactly once.
        assertTrue(_contains(seen, alice));
        assertTrue(_contains(seen, bob));
        assertTrue(_contains(seen, carol));

        // No duplicates.
        for (uint256 i = 0; i < seen.length; i++) {
            for (uint256 j = i + 1; j < seen.length; j++) {
                assertTrue(seen[i] != seen[j]);
            }
        }
    }

    /// @dev Any contribution amount within the PoolFactory bounds should
    ///      never leave the contract with a negative USDC balance and should
    ///      always drain to zero at completion.
    function testFuzz_DrainInvariant(uint256 contribAmt) public {
        contribAmt = bound(contribAmt, 10 * 1e6, 10_000 * 1e6);

        MockUSDC u = new MockUSDC();
        MockVRFCoordinator v = new MockVRFCoordinator();
        SusuPool p = new SusuPool(
            address(u), contribAmt, NUM_MEMBERS, INTERVAL,
            organiser, feeRecipient, address(v), SUB_ID, KEY_HASH
        );

        address[3] memory players = [alice, bob, carol];
        for (uint256 i = 0; i < 3; i++) {
            u.mint(players[i], contribAmt * 100);
            vm.prank(players[i]);
            u.approve(address(p), type(uint256).max);
            vm.prank(players[i]);
            p.join();
        }

        v.fulfill(1, 1);

        for (uint256 cyc = 0; cyc < NUM_MEMBERS; cyc++) {
            for (uint256 i = 0; i < 3; i++) {
                vm.prank(players[i]);
                p.contribute();
            }
        }

        assertEq(uint8(p.status()), uint8(ISusuPool.PoolStatus.COMPLETED));
        assertEq(u.balanceOf(address(p)), 0, "contract not drained");
    }

    // ---------- helpers ----------

    function _contains(address[] memory arr, address needle) internal pure returns (bool) {
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == needle) return true;
        }
        return false;
    }
}
