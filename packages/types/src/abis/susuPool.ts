/**
 * SusuPool fragment — events indexed by The Graph + functions called from mobile.
 * Full ABI will be generated from contracts/out/SusuPool.sol/SusuPool.json in Step 2.
 */

export const SUSU_POOL_ABI = [
  // ---------- Functions ----------
  {
    type: "function",
    name: "join",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "contribute",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "contribution",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "depositAmount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "currentCycle",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "cycleDeadline",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },

  // ---------- Events (indexed by subgraph) ----------
  {
    type: "event",
    name: "MemberJoined",
    inputs: [
      { name: "member", type: "address", indexed: true },
      { name: "depositAmount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PoolActivated",
    inputs: [
      { name: "startTime", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "RotationSet",
    inputs: [
      { name: "order", type: "address[]", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ContributionReceived",
    inputs: [
      { name: "member", type: "address", indexed: true },
      { name: "cycle", type: "uint256", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PayoutExecuted",
    inputs: [
      { name: "recipient", type: "address", indexed: true },
      { name: "cycle", type: "uint256", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "fee", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "MemberSlashed",
    inputs: [
      { name: "member", type: "address", indexed: true },
      { name: "cycle", type: "uint256", indexed: true },
      { name: "slashAmount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PoolCompleted",
    inputs: [
      { name: "finalCycle", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "DepositReturned",
    inputs: [
      { name: "member", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;
