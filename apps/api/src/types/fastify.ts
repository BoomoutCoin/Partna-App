/**
 * Fastify type augmentations for PartNA-specific decorators.
 */

import "fastify";
import "@fastify/jwt";
import type { Address } from "@partna/types";

// `request.user` is set by the auth hook after JWT verification.
export interface AuthenticatedUser {
  walletAddress: Address;
  method: "wallet" | "privy";
  iat: number;
  exp: number;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    // The `payload` shape is what we sign.
    payload: { sub: Address; method: "wallet" | "privy" };
    // The `user` shape is what is decoded back.
    user: AuthenticatedUser;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    /**
     * Route-level guard. Add as a preHandler on any route that requires auth.
     * Rejects with 401 if the JWT is missing or invalid.
     */
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    user: AuthenticatedUser;
  }
}
