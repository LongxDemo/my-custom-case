import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";

import { d1First, d1Query } from "@/integrations/d1/client.server";
import {
  createSession,
  currentUser,
  deleteSession,
  hashPassword,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  verifyPassword,
  type AuthUser,
} from "./auth.server";

function setSessionCookie(token: string) {
  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export const signUp = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
      displayName: z.string().optional(),
    }),
  )
  .handler(async ({ data }): Promise<AuthUser> => {
    const email = data.email.trim().toLowerCase();
    const existing = await d1First("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) throw new Error("An account with this email already exists.");

    const id = crypto.randomUUID();
    const displayName = data.displayName?.trim() || email.split("@")[0];
    const passwordHash = await hashPassword(data.password);

    // Bootstrap: the first account ever created becomes the back-office admin.
    const count = await d1First<{ n: number }>("SELECT COUNT(*) AS n FROM users");
    const isAdmin = (count?.n ?? 0) === 0 ? 1 : 0;

    await d1Query(
      "INSERT INTO users (id, email, password_hash, display_name, is_admin) VALUES (?, ?, ?, ?, ?)",
      [id, email, passwordHash, displayName, isAdmin],
    );
    setSessionCookie(await createSession(id));
    return { id, email, display_name: displayName, is_admin: isAdmin };
  });

export const signIn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().email(), password: z.string().min(1) }))
  .handler(async ({ data }): Promise<AuthUser> => {
    const email = data.email.trim().toLowerCase();
    const row = await d1First<{
      id: string;
      email: string;
      password_hash: string;
      display_name: string | null;
      is_admin: number;
    }>("SELECT id, email, password_hash, display_name, is_admin FROM users WHERE email = ?", [
      email,
    ]);
    if (!row || !(await verifyPassword(data.password, row.password_hash))) {
      throw new Error("Invalid email or password.");
    }
    setSessionCookie(await createSession(row.id));
    return { id: row.id, email: row.email, display_name: row.display_name, is_admin: row.is_admin };
  });

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const token = getCookie(SESSION_COOKIE);
  if (token) await deleteSession(token);
  deleteCookie(SESSION_COOKIE, { path: "/" });
  return { ok: true };
});

export const getMe = createServerFn({ method: "GET" }).handler(
  async (): Promise<AuthUser | null> => currentUser(),
);
