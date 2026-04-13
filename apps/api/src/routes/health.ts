/**
 * GET /health — liveness + readiness probe.
 *
 * Railway hits this. Returns 200 if the process can answer HTTP *and* the
 * Supabase service-role client can reach the database.
 */

import type { FastifyInstance } from "fastify";
import { supabaseAdmin } from "../db.js";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async (_request, reply) => {
    // Cheap liveness — no DB round trip.
    return reply.send({ status: "ok", ts: Date.now() });
  });

  app.get("/health/ready", async (_request, reply) => {
    try {
      // Minimal readiness: 1-row ping against a table we know exists.
      // `head: true` + `count: 'exact'` returns no rows, just the count header.
      const { error } = await supabaseAdmin
        .from("users")
        .select("wallet_address", { count: "exact", head: true });
      if (error) throw error;
      return reply.send({ status: "ok", ts: Date.now() });
    } catch (err) {
      app.log.error({ err }, "readiness check failed");
      return reply.code(503).send({ status: "unready", error: "db_unreachable" });
    }
  });
}
