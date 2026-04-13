/**
 * PoolFactory fragment — createPool call + PoolCreated event (indexed by subgraph).
 * Full ABI will be generated from contracts/out/PoolFactory.sol/PoolFactory.json in Step 2.
 */

export const POOL_FACTORY_ABI = [
  {
    type: "function",
    name: "createPool",
    stateMutability: "nonpayable",
    inputs: [
      { name: "contribution", type: "uint256" },
      { name: "numMembers", type: "uint8" },
      { name: "intervalSecs", type: "uint256" },
    ],
    outputs: [{ name: "pool", type: "address" }],
  },
  {
    type: "function",
    name: "allPoolsLength",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "PoolCreated",
    inputs: [
      { name: "pool", type: "address", indexed: true },
      { name: "organiser", type: "address", indexed: true },
      { name: "contribution", type: "uint256", indexed: false },
      { name: "numMembers", type: "uint8", indexed: false },
      { name: "intervalSecs", type: "uint256", indexed: false },
    ],
  },
] as const;
