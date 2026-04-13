/**
 * ky HTTP client for the PartNA API.
 *
 * Features:
 *   - Auto-attaches the session JWT from useAuthStore on every request
 *   - 10s timeout
 *   - 1 retry on network errors (not 4xx/5xx)
 *   - Logs 401s, clears session, and lets the caller handle the error
 */

import ky, { type KyInstance, HTTPError } from "ky";
import { env } from "./env";
import { useAuthStore } from "../store/authStore";

export const api: KyInstance = ky.create({
  prefixUrl: env.apiUrl,
  timeout: 10_000,
  retry: {
    limit: 1,
    methods: ["get", "head"],
    statusCodes: [408, 429, 502, 503, 504],
  },
  hooks: {
    beforeRequest: [
      (request) => {
        const jwt = useAuthStore.getState().jwt;
        if (jwt) {
          request.headers.set("authorization", `Bearer ${jwt}`);
        }
      },
    ],
    afterResponse: [
      (_request, _options, response) => {
        if (response.status === 401) {
          // Token expired or revoked — clear local session so AuthGate kicks
          // the user back to sign-in.
          useAuthStore.getState().clearSession();
        }
        return response;
      },
    ],
  },
});

// ---------- Typed error helper ----------

export async function extractApiError(err: unknown): Promise<string> {
  if (err instanceof HTTPError) {
    try {
      const body = (await err.response.json()) as { error?: string };
      return body.error ?? err.message;
    } catch {
      return err.message;
    }
  }
  if (err instanceof Error) return err.message;
  return "Unknown error";
}
