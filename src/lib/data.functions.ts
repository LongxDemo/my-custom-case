import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { d1First, d1Query } from "@/integrations/d1/client.server";
import type { DesignState } from "./studio";
import { requireUser } from "./auth.server";

function parseJson(raw: unknown): DesignState | null {
  if (raw == null) return null;
  if (typeof raw !== "string") return raw as DesignState;
  try {
    return JSON.parse(raw) as DesignState;
  } catch {
    return null;
  }
}

export interface DesignRecord {
  id: string;
  name: string;
  phone_model: string | null;
  platform: string | null;
  design_json: DesignState | null;
  created_at: string;
}

export const listDesigns = createServerFn({ method: "GET" }).handler(
  async (): Promise<DesignRecord[]> => {
    const user = await requireUser();
    const rows = await d1Query<DesignRecord>(
      `SELECT id, name, phone_model, platform, design_json, created_at
         FROM designs WHERE user_id = ? ORDER BY updated_at DESC`,
      [user.id],
    );
    return rows.map((r) => ({ ...r, design_json: parseJson(r.design_json) }));
  },
);

export const getDesign = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }): Promise<DesignRecord | null> => {
    const user = await requireUser();
    const row = await d1First<DesignRecord>(
      `SELECT id, name, phone_model, platform, design_json, created_at
         FROM designs WHERE id = ? AND user_id = ?`,
      [data.id, user.id],
    );
    return row ? { ...row, design_json: parseJson(row.design_json) } : null;
  });

export const saveDesign = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().optional(),
      name: z.string(),
      phone_model: z.string().nullable().optional(),
      platform: z.string().nullable().optional(),
      design: z.unknown(),
    }),
  )
  .handler(async ({ data }): Promise<{ id: string }> => {
    const user = await requireUser();
    const json = JSON.stringify(data.design ?? {});
    const name = data.name.trim() || "Untitled design";
    const model = data.phone_model ?? null;
    const platform = data.platform ?? null;

    if (data.id) {
      const owned = await d1First("SELECT id FROM designs WHERE id = ? AND user_id = ?", [
        data.id,
        user.id,
      ]);
      if (owned) {
        await d1Query(
          `UPDATE designs SET name = ?, phone_model = ?, platform = ?, design_json = ?,
             updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
          [name, model, platform, json, data.id, user.id],
        );
        return { id: data.id };
      }
    }
    const id = crypto.randomUUID();
    await d1Query(
      `INSERT INTO designs (id, user_id, name, phone_model, platform, design_json)
         VALUES (?, ?, ?, ?, ?, ?)`,
      [id, user.id, name, model, platform, json],
    );
    return { id };
  });

export const deleteDesign = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const user = await requireUser();
    await d1Query("DELETE FROM designs WHERE id = ? AND user_id = ?", [data.id, user.id]);
    return { ok: true };
  });

export interface OrderRecord {
  id: string;
  phone_model: string | null;
  status: string;
  price_cents: number | null;
  created_at: string;
  design_name: string | null;
  design_json: DesignState | null;
}

export const listOrders = createServerFn({ method: "GET" }).handler(
  async (): Promise<OrderRecord[]> => {
    const user = await requireUser();
    const rows = await d1Query<OrderRecord>(
      `SELECT o.id, o.phone_model, o.status, o.price_cents, o.created_at,
              d.name AS design_name, d.design_json
         FROM orders o LEFT JOIN designs d ON d.id = o.design_id
        WHERE o.user_id = ? ORDER BY o.created_at DESC`,
      [user.id],
    );
    return rows.map((r) => ({ ...r, design_json: parseJson(r.design_json) }));
  },
);

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      design_id: z.string().nullable().optional(),
      phone_model: z.string().nullable().optional(),
      price_cents: z.number().int().nullable().optional(),
    }),
  )
  .handler(async ({ data }): Promise<{ id: string }> => {
    const user = await requireUser();
    const id = crypto.randomUUID();
    await d1Query(
      `INSERT INTO orders (id, user_id, design_id, phone_model, status, price_cents)
         VALUES (?, ?, ?, ?, 'pending', ?)`,
      [id, user.id, data.design_id ?? null, data.phone_model ?? null, data.price_cents ?? null],
    );
    return { id };
  });
