/**
 * Auth plugin.
 *
 * Registers `@fastify/jwt` with our shared secret and decorates the server
 * with an `authenticate` preHandler. Routes opt in by listing
 * `preHandler: [app.authenticate]`.
 *
 * The actual /auth/wallet signature-verification route lives in routes/auth.ts
 * (added in Step 5).
 */

import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { Address } from "viem";

import { env } from "../config.js";
import type { AuthenticatedUser } from "../types/fastify.js";

async function authPlugin(app: FastifyInstance): Promise<void> {
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
    // Transform the raw JWT payload (sub/method) into the shape the rest of
    // the codebase sees on `request.user`.
    formatUser: (payload): AuthenticatedUser => {
      const p = payload as {
        sub?: string;
        method?: "wallet" | "privy";
        iat?: number;
        exp?: number;
      };
      return {
        walletAddress: (p.sub ?? "0x") as Address,
        method: p.method ?? "wallet",
        iat: p.iat ?? 0,
        exp: p.exp ?? 0,
      };
    },
  });

  app.decorate(
    "authenticate",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify();
      } catch (err) {
        request.log.warn({ err }, "jwt verify failed");
        return reply.code(401).send({ error: "Unauthorized" });
      }
    },
  );
}

export default fp(authPlugin, {
  name: "partna-auth",
  fastify: "4.x",
});
