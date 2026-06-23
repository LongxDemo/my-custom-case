// Server-only auth: password hashing (Web Crypto PBKDF2) + D1-backed sessions.
// Works on both Node (dev) and Cloudflare Workers (prod) — uses only the
// standard `crypto.subtle` Web Crypto API.
import { getCookie } from "@tanstack/react-start/server";
import { d1First, d1Query } from "@/integrations/d1/client.server";

const PBKDF2_ITERATIONS = 100_000;
const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

async function pbkdf2(password: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password) as BufferSource,
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
}

/** Returns "saltHex:hashHex" for storage. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `${bytesToHex(salt)}:${await pbkdf2(password, salt)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const computed = await pbkdf2(password, hexToBytes(saltHex));
  if (computed.length !== hashHex.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ hashHex.charCodeAt(i);
  return diff === 0;
}

export interface AuthUser {
  id: string;
  email: string;
  display_name: string | null;
}

export const SESSION_COOKIE = "cc_session";
const SESSION_DAYS = 30;
export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
  await d1Query("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", [
    token,
    userId,
    expiresAt,
  ]);
  return token;
}

export async function deleteSession(token: string): Promise<void> {
  await d1Query("DELETE FROM sessions WHERE id = ?", [token]);
}

export async function getSessionUser(token: string | undefined): Promise<AuthUser | null> {
  if (!token) return null;
  return d1First<AuthUser>(
    `SELECT u.id, u.email, u.display_name
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > datetime('now')`,
    [token],
  );
}

/** Current user from the request's session cookie (or null). */
export async function currentUser(): Promise<AuthUser | null> {
  return getSessionUser(getCookie(SESSION_COOKIE));
}

/** Like currentUser but throws if not signed in — use to guard mutations. */
export async function requireUser(): Promise<AuthUser> {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
