// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import {IVRFCoordinatorV2Plus} from
    "@chainlink/contracts/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";

/// @dev Minimal VRFCoordinator stub used only by Foundry tests. Records each
///      request and exposes a helper to fulfil it on the consumer contract.
///      Implements only `requestRandomWords` from IVRFCoordinatorV2Plus; all
///      other functions revert.
contract MockVRFCoordinator {
    uint256 public nextRequestId = 1;
    mapping(uint256 => address) public consumerOf;

    function requestRandomWords(VRFV2PlusClient.RandomWordsRequest calldata /*req*/)
        external
        returns (uint256 requestId)
    {
        requestId = nextRequestId++;
        consumerOf[requestId] = msg.sender;
    }

    /// @dev Test helper: fulfil a request with deterministic `seed`.
    function fulfill(uint256 requestId, uint256 seed) external {
        address consumer = consumerOf[requestId];
        require(consumer != address(0), "unknown request");
        uint256[] memory words = new uint256[](1);
        words[0] = seed;
        // Same entry point the real coordinator calls.
        (bool ok,) = consumer.call(
            abi.encodeWithSignature("rawFulfillRandomWords(uint256,uint256[])", requestId, words)
        );
        require(ok, "fulfil failed");
    }

    // ---------- Unused surface, revert on call ----------
    fallback() external payable { revert("mock: not implemented"); }
    receive() external payable { revert("mock: not implemented"); }
}
