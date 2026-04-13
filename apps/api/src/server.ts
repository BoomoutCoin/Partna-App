/**
 * Server factory.
 *
 * Keeping the app construction separate from `listen()` (in index.ts) makes
 * it easy to spin up ephemeral instances in tests without opening a port.
 */

import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import rateLimit from "@fastify/rate-limit";

import { env, isProd } from "./config.js";
import "./types/fastify.js"; // side-effect: load module augmentation
import authPlugin from "./plugins/auth.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { userRoutes } from "./routes/users.js";
import { webhookRoutes } from "./routes/webhooks.js";
import { notificationRoutes } from "./routes/notifications.js";
import { inviteRoutes } from "./routes/invites.js";
import { subscriptionRoutes } from "./routes/subscriptions.js";

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      ...(isProd
        ? {}
        : {
            transport: {
              target: "pino-pretty",
              options: { colorize: true, translateTime: "SYS:HH:MM:ss" },
            },
          }),
    },
    // Railway can hand us a forwarded IP; trust the proxy so rate limiting
    // and request logging see the real client address.
    trustProxy: true,
    disableRequestLogging: false,
    bodyLimit: 1024 * 1024, // 1MB; raise for webhooks if needed later
  });

  // ---------- Security / ergonomics ----------
  await app.register(helmet, {
    // API-only server: no HTML, so CSP is more permissive without risk.
    contentSecurityPolicy: false,
  });

  await app.register(cors, {
    // Tighten in prod. For now allow the Expo dev client + native app origins.
    origin: isProd
      ? ["https://partna.app", "https://www.partna.app"]
      : true,
    credentials: true,
  });

  await app.register(sensible);

  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: "1 minute",
    // TODO: wire to Redis once REDIS_URL is provisioned.
  });

  // ---------- Auth ----------
  await app.register(authPlugin);

  // ---------- Routes ----------
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(userRoutes);
  await app.register(webhookRoutes);
  await app.register(notificationRoutes);
  await app.register(inviteRoutes);
  await app.register(subscriptionRoutes);

  // ---------- Not-found handler ----------
  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({ error: "Not Found", path: request.url });
  });

  // ---------- Error handler ----------
  app.setErrorHandler((err, request, reply) => {
    request.log.error({ err }, "request failed");
    const status = err.statusCode ?? 500;
    reply.code(status).send({
      error: status >= 500 ? "Internal Server Error" : err.message,
    });
  });

  return app;
}
