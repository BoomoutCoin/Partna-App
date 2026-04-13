/**
 * Auth + pool service — Supabase REST calls for sign-up and pool creation.
 *
 * Uses the ANON key only (safe for client bundles). The service_role key
 * NEVER ships in the mobile app — it stays server-side in apps/api/.env.
 *
 * For demo mode (no real wallet), we use Supabase's PostgREST with the
 * anon key. RLS policies allow inserts where the caller provides their
 * own wallet_address. For production, all writes go through apps/api.
 */

import type { User, Address } from "@partna/types";
import { DEMO_USER } from "./demoData";

const API_BASE = "https://jentqryenqqylgiojdnt.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplbnRxcnllbnFxeWxnaW9qZG50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNzU4OTksImV4cCI6MjA5MTY1MTg5OX0.CNU11dtcx78SDJPvk_Q0o9bMlP3rxhHz0dJlMAXWRD0";

const headers = {
  "Content-Type": "application/json",
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
};

interface AuthResult {
  user: User;
  jwt: string;
}

function safeParseDateToUnix(raw: unknown): number {
  if (typeof raw === "string" && raw.length > 0) {
    const ms = new Date(raw).getTime();
    if (!Number.isNaN(ms)) return Math.floor(ms / 1000);
  }
  return Math.floor(Date.now() / 1000);
}

/**
 * Sign up: create user row in Supabase, return session.
 */
export async function demoSignUp(displayName: string): Promise<AuthResult> {
  const trimmed = displayName.trim();
  if (trimmed.length < 2) {
    return {
      user: { ...DEMO_USER, displayName: trimmed || "Guest" },
      jwt: "demo-jwt-token",
    };
  }

  const walletAddress = generateDemoWallet(trimmed);

  try {
    // Upsert user (merge on conflict)
    await fetch(`${API_BASE}/rest/v1/users`, {
      method: "POST",
      headers: { ...headers, Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({
        wallet_address: walletAddress,
        display_name: trimmed,
        on_time_rate: 0,
        is_pro: false,
      }),
    });

    // Fetch user back to confirm
    const userRes = await fetch(
      `${API_BASE}/rest/v1/users?wallet_address=eq.${walletAddress}&select=*&limit=1`,
      { headers },
    );

    if (userRes.ok) {
      const rows = (await userRes.json()) as Array<Record<string, unknown>>;
      if (rows[0]) {
        const r = rows[0];
        return {
          user: {
            walletAddress: (r.wallet_address as string) as Address,
            displayName: (r.display_name as string) ?? trimmed,
            avatarUrl: null,
            onTimeRate: (r.on_time_rate as number) ?? 0,
            isPro: (r.is_pro as boolean) ?? false,
            createdAt: safeParseDateToUnix(r.created_at),
          },
          jwt: "supabase-session",
        };
      }
    }
  } catch {
    // Network error — fall back to local demo
  }

  return {
    user: { ...DEMO_USER, displayName: trimmed, walletAddress: walletAddress as Address },
    jwt: "demo-jwt-token",
  };
}

/**
 * Create pool metadata in Supabase.
 */
export async function createPoolInDb(params: {
  displayName: string;
  contribution: string;
  numMembers: number;
  interval: string;
  isPrivate: boolean;
  organiserAddress: string;
}): Promise<{ poolAddress: string; success: boolean }> {
  const poolAddress = generateDemoWallet(params.displayName + Date.now());

  try {
    const res = await fetch(`${API_BASE}/rest/v1/pool_metadata`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({
        contract_address: poolAddress,
        display_name: params.displayName,
        organiser_address: params.organiserAddress,
        description: `${params.contribution} USDC × ${params.numMembers} members × ${params.interval}`,
        is_private: params.isPrivate,
      }),
    });

    return { poolAddress, success: res.ok || res.status === 201 };
  } catch {
    return { poolAddress, success: false };
  }
}

/**
 * Fetch pools by organiser.
 */
export async function fetchUserPools(
  organiserAddress: string,
): Promise<
  Array<{
    contract_address: string;
    display_name: string;
    description: string;
    is_private: boolean;
    created_at: string;
  }>
> {
  try {
    const res = await fetch(
      `${API_BASE}/rest/v1/pool_metadata?organiser_address=eq.${organiserAddress}&select=*&order=created_at.desc`,
      { headers },
    );
    if (res.ok)
      return (await res.json()) as Array<{
        contract_address: string;
        display_name: string;
        description: string;
        is_private: boolean;
        created_at: string;
      }>;
  } catch {
    /* fallback */
  }
  return [];
}

function generateDemoWallet(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(40, "0").slice(0, 40);
  return `0x${hex}`;
}
