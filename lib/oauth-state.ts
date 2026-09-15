import { createHmac, timingSafeEqual } from "node:crypto";

export function createOAuthState(payload: { businessId: string; userId: string }) {
  const encoded = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 10 * 60_000 })).toString("base64url");
  const signature = createHmac("sha256", stateSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function readOAuthState(state: string | null): { businessId: string; userId: string } | null {
  if (!state) return null;
  const [encoded, signature] = state.split(".");
  if (!encoded || !signature) return null;
  const expected = createHmac("sha256", stateSecret()).update(encoded).digest("base64url");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!payload.businessId || !payload.userId || Number(payload.exp) < Date.now()) return null;
    return { businessId: payload.businessId, userId: payload.userId };
  } catch {
    return null;
  }
}

function stateSecret() {
  return process.env.OAUTH_STATE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "";
}
