/**
 * Subscription routes (Stripe Pro tier).
 *
 *   GET    /subscriptions/me       — plan status
 *   POST   /subscriptions/checkout — Stripe Checkout session URL
 *   POST   /subscriptions/portal   — Stripe Customer Portal URL
 *   DELETE /subscriptions/me       — cancel
 */

import type { FastifyInstance } from "fastify";
import { env } from "../config.js";
import { supabaseAdmin } from "../db.js";

export async function subscriptionRoutes(app: FastifyInstance): Promise<void> {
  // ---------- GET /subscriptions/me ----------
  app.get(
    "/subscriptions/me",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { data, error } = await supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("wallet_address", request.user.walletAddress)
        .maybeSingle();

      if (error) return reply.code(500).send({ error: "Database error" });
      if (!data) return reply.send({ subscription: null, isPro: false });

      return reply.send({
        subscription: data,
        isPro: data.status === "active" || data.status === "trialing",
      });
    },
  );

  // ---------- POST /subscriptions/checkout ----------
  app.post(
    "/subscriptions/checkout",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRO_PRICE_ID) {
        return reply.code(501).send({ error: "Stripe not configured" });
      }

      // Dynamic import to keep Stripe optional in dev
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(env.STRIPE_SECRET_KEY);

      // Find or create Stripe customer
      let { data: sub } = await supabaseAdmin
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("wallet_address", request.user.walletAddress)
        .maybeSingle();

      let customerId = sub?.stripe_customer_id;
      if (!customerId) {
        const customer = await stripe.customers.create({
          metadata: { wallet_address: request.user.walletAddress },
        });
        customerId = customer.id;
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
        success_url: "partna://subscription/success",
        cancel_url: "partna://subscription/cancel",
        metadata: { wallet_address: request.user.walletAddress },
      });

      return reply.send({ url: session.url });
    },
  );

  // ---------- POST /subscriptions/portal ----------
  app.post(
    "/subscriptions/portal",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      if (!env.STRIPE_SECRET_KEY) {
        return reply.code(501).send({ error: "Stripe not configured" });
      }

      const { data: sub } = await supabaseAdmin
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("wallet_address", request.user.walletAddress)
        .maybeSingle();

      if (!sub?.stripe_customer_id) {
        return reply.code(404).send({ error: "No subscription found" });
      }

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(env.STRIPE_SECRET_KEY);

      const session = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        return_url: "partna://profile",
      });

      return reply.send({ url: session.url });
    },
  );

  // ---------- DELETE /subscriptions/me ----------
  app.delete(
    "/subscriptions/me",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      if (!env.STRIPE_SECRET_KEY) {
        return reply.code(501).send({ error: "Stripe not configured" });
      }

      const { data: sub } = await supabaseAdmin
        .from("subscriptions")
        .select("stripe_subscription_id")
        .eq("wallet_address", request.user.walletAddress)
        .maybeSingle();

      if (!sub?.stripe_subscription_id) {
        return reply.code(404).send({ error: "No subscription found" });
      }

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(env.STRIPE_SECRET_KEY);

      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        cancel_at_period_end: true,
      });

      await supabaseAdmin
        .from("subscriptions")
        .update({ cancel_at_period_end: true })
        .eq("wallet_address", request.user.walletAddress);

      return reply.send({ ok: true });
    },
  );
}
