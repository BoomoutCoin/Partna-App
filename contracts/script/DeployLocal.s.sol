// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {PoolFactory} from "../src/PoolFactory.sol";

/// @dev Local-only deployment script targeting Anvil.
///      Run: forge script script/DeployLocal.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
contract DeployLocal is Script {
    function run() external {
        // Anvil's default first private key
        uint256 deployerKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        // Deploy a mock USDC (simple ERC20 with mint)
        MockUSDC usdc = new MockUSDC();
        console2.log("MockUSDC deployed at:", address(usdc));

        // Mint 1M USDC to the first 5 Anvil accounts
        for (uint i = 0; i < 5; i++) {
            address account = vm.addr(uint256(keccak256(abi.encodePacked(deployerKey + i))));
            // Use the deterministic Anvil accounts instead
        }
        // Anvil accounts 0-4
        address[5] memory accounts = [
            0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266,
            0x70997970C51812dc3A010C7d01b50e0d17dc79C8,
            0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC,
            0x90F79bf6EB2c4f870365E785982E1f101E93b906,
            0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
        ];
        for (uint i = 0; i < 5; i++) {
            usdc.mint(accounts[i], 100_000 * 1e6); // 100k USDC each
        }
        console2.log("Minted 100k USDC to 5 Anvil accounts");

        // Deploy mock VRF coordinator
        MockVRFCoordinator vrfCoord = new MockVRFCoordinator();
        console2.log("MockVRF deployed at:", address(vrfCoord));

        // Deploy PoolFactory (UUPS proxy)
        PoolFactory impl = new PoolFactory();
        bytes memory initData = abi.encodeWithSelector(
            PoolFactory.initialize.selector,
            deployer,           // owner
            address(usdc),      // usdc
            deployer,           // feeRecipient (deployer for local)
            address(vrfCoord),  // vrfCoordinator
            uint256(1),         // vrfSubscriptionId
            bytes32(uint256(1)) // vrfKeyHash
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        PoolFactory factory = PoolFactory(address(proxy));
        console2.log("PoolFactory proxy deployed at:", address(factory));

        // Create a sample pool (100 USDC, 3 members, weekly)
        address samplePool = factory.createPool(100 * 1e6, 3, 7 days);
        console2.log("Sample pool created at:", samplePool);

        vm.stopBroadcast();

        // Summary
        console2.log("========== LOCAL DEPLOYMENT SUMMARY ==========");
        console2.log("USDC:          ", address(usdc));
        console2.log("VRF Coordinator:", address(vrfCoord));
        console2.log("PoolFactory:   ", address(factory));
        console2.log("Sample Pool:   ", samplePool);
        console2.log("Chain ID:       31337 (Anvil)");
        console2.log("===============================================");
    }
}

/// @dev Inline mock USDC for local deployment (reuses the test mock pattern).
contract MockUSDC {
    string public name = "Mock USDC";
    string public symbol = "USDC";
    uint8 public decimals = 6;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}

/// @dev Inline mock VRF coordinator for local deployment.
contract MockVRFCoordinator {
    uint256 public nextRequestId = 1;
    mapping(uint256 => address) public consumerOf;

    struct RandomWordsRequest {
        bytes32 keyHash;
        uint256 subId;
        uint16 requestConfirmations;
        uint32 callbackGasLimit;
        uint32 numWords;
        bytes extraArgs;
    }

    function requestRandomWords(RandomWordsRequest calldata) external returns (uint256 requestId) {
        requestId = nextRequestId++;
        consumerOf[requestId] = msg.sender;
    }

    function fulfill(uint256 requestId, uint256 seed) external {
        address consumer = consumerOf[requestId];
        require(consumer != address(0), "unknown request");
        uint256[] memory words = new uint256[](1);
        words[0] = seed;
        (bool ok,) = consumer.call(
            abi.encodeWithSignature("rawFulfillRandomWords(uint256,uint256[])", requestId, words)
        );
        require(ok, "fulfil failed");
    }

    fallback() external payable {}
    receive() external payable {}
}
