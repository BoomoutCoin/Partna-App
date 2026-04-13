// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import {PoolFactory} from "../src/PoolFactory.sol";
import {SusuPool} from "../src/SusuPool.sol";
import {ISusuPool} from "../src/interfaces/ISusuPool.sol";
import {MockUSDC} from "./mocks/MockUSDC.sol";
import {MockVRFCoordinator} from "./mocks/MockVRFCoordinator.sol";

contract PoolFactoryTest is Test {
    PoolFactory internal factory;
    MockUSDC internal usdc;
    MockVRFCoordinator internal vrf;

    address internal admin = makeAddr("admin");
    address internal feeRecipient = makeAddr("feeRecipient");
    address internal organiser = makeAddr("organiser");

    function setUp() public {
        usdc = new MockUSDC();
        vrf = new MockVRFCoordinator();

        PoolFactory impl = new PoolFactory();
        bytes memory initData = abi.encodeWithSelector(
            PoolFactory.initialize.selector,
            admin,
            address(usdc),
            feeRecipient,
            address(vrf),
            uint256(1),
            bytes32(uint256(1))
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        factory = PoolFactory(address(proxy));
    }

    function test_Initialize() public view {
        assertEq(factory.owner(), admin);
        assertEq(factory.usdc(), address(usdc));
        assertEq(factory.feeRecipient(), feeRecipient);
    }

    function test_CreatePool_HappyPath() public {
        vm.prank(organiser);
        address poolAddr = factory.createPool(100 * 1e6, 5, 7 days);
        assertTrue(poolAddr != address(0));
        assertEq(factory.allPoolsLength(), 1);
        assertEq(factory.poolsOfLength(organiser), 1);
        assertTrue(factory.isRegistered(poolAddr));

        SusuPool pool = SusuPool(poolAddr);
        assertEq(pool.contribution(), 100 * 1e6);
        assertEq(pool.numMembers(), 5);
        assertEq(pool.organiser(), organiser);
        assertEq(uint8(pool.status()), uint8(ISusuPool.PoolStatus.FILLING));
    }

    function test_CreatePool_RevertsBelowMinContribution() public {
        vm.expectRevert(PoolFactory.ContributionOutOfRange.selector);
        factory.createPool(1 * 1e6, 5, 7 days);
    }

    function test_CreatePool_RevertsAboveMaxContribution() public {
        vm.expectRevert(PoolFactory.ContributionOutOfRange.selector);
        factory.createPool(20_000 * 1e6, 5, 7 days);
    }

    function test_CreatePool_RevertsBelowMinMembers() public {
        vm.expectRevert(PoolFactory.MembersOutOfRange.selector);
        factory.createPool(100 * 1e6, 2, 7 days);
    }

    function test_CreatePool_RevertsAboveMaxMembers() public {
        vm.expectRevert(PoolFactory.MembersOutOfRange.selector);
        factory.createPool(100 * 1e6, 21, 7 days);
    }

    function test_CreatePool_RevertsBelowMinInterval() public {
        vm.expectRevert(PoolFactory.IntervalOutOfRange.selector);
        factory.createPool(100 * 1e6, 5, 1 hours);
    }

    function test_CreatePool_RevertsAboveMaxInterval() public {
        vm.expectRevert(PoolFactory.IntervalOutOfRange.selector);
        factory.createPool(100 * 1e6, 5, 365 days);
    }

    /// @dev TVL = numMembers * 2 * contribution. 20 members × 2 × $2,000 = $80k > $50k cap.
    function test_CreatePool_RevertsAboveTvlCap() public {
        vm.expectRevert(PoolFactory.TvlCapExceeded.selector);
        factory.createPool(2_000 * 1e6, 20, 7 days);
    }

    /// @dev Exactly at the cap should succeed: 20 × 2 × $1,250 = $50k.
    function test_CreatePool_AcceptsAtTvlCap() public {
        vm.prank(organiser);
        factory.createPool(1_250 * 1e6, 20, 7 days);
        assertEq(factory.allPoolsLength(), 1);
    }

    function testFuzz_CreatePool_RespectsAllBounds(
        uint256 contrib,
        uint8 numMembers,
        uint256 interval
    ) public {
        contrib = bound(contrib, 10 * 1e6, 10_000 * 1e6);
        numMembers = uint8(bound(uint256(numMembers), 3, 20));
        interval = bound(interval, 1 days, 90 days);

        uint256 tvl = uint256(numMembers) * 2 * contrib;
        vm.assume(tvl <= 50_000 * 1e6);

        vm.prank(organiser);
        address poolAddr = factory.createPool(contrib, numMembers, interval);
        assertTrue(poolAddr != address(0));
    }
}
