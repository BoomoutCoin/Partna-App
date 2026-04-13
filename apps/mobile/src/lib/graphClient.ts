/**
 * Apollo Client — The Graph subgraph queries for pool state.
 *
 * We use Apollo here (not urql / react-query) because the spec already
 * standardises on Apollo for subgraph reads and because it composes well
 * with the subgraph's optimistic caching.
 */

import { ApolloClient, InMemoryCache, HttpLink, gql } from "@apollo/client";
import { env } from "./env";

export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: env.graphUrl }),
  cache: new InMemoryCache({
    typePolicies: {
      Pool: {
        keyFields: ["id"],
      },
      Member: {
        keyFields: ["id"],
      },
    },
  }),
  // Apollo's RN integration hasn't shipped a stable SSR-disable default;
  // we explicitly enable connectToDevTools only in dev for profiling.
  connectToDevTools: env.profile === "development",
});

// ---------- Canonical queries ----------

export const GET_POOL = gql`
  query GetPool($id: ID!) {
    pool(id: $id) {
      id
      organiser
      status
      contribution
      numMembers
      intervalSeconds
      currentCycle
      cycleDeadline
      currentPot
      totalContributed
      feeBps
      createdAt
      members {
        id
        address
        rotationIndex
        hasReceivedPayout
        slashed
        paidThisCycle
        onTimeCycles
        totalCycles
        joinedAt
      }
    }
  }
`;

export const GET_MY_POOLS = gql`
  query GetMyPools($address: String!) {
    members(where: { address: $address }) {
      pool {
        id
        organiser
        status
        contribution
        numMembers
        intervalSeconds
        currentCycle
        cycleDeadline
        currentPot
        totalContributed
        feeBps
        createdAt
      }
    }
  }
`;
