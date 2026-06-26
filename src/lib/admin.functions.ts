import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { d1Query } from "@/integrations/d1/client.server";
import { requireAdmin } from "./auth.server";
import type { DesignState } from "./studio";

// Allowed order statuses for the fulfillment pipeline. Keep in sync with the
// badge styles in routes/_authenticated/admin.tsx.
export const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

function parseJson(raw: unknown): DesignState | null {
  if (raw == null) return null;
  if (typeof raw !== "string") return raw as DesignState;
  try {
    return JSON.parse(raw) as DesignState;
  } catch {
    return null;
  }
}

export interface AdminOrderRecord {
  id: string;
  status: string;
  phone_model: string | null;
  price_cents: number | null;
  created_at: string;
  customer_email: string | null;
  customer_name: string | null;
  design_name: string | null;
  design_json: DesignState | null;
}

/** Every order across all customers, newest first. Admin only. */
export const adminListOrders = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminOrderRecord[]> => {
    await requireAdmin();
    const rows = await d1Query<AdminOrderRecord>(
      `SELECT o.id, o.status, o.phone_model, o.price_cents, o.created_at,
              u.email AS customer_email, u.display_name AS customer_name,
              d.name AS design_name, d.design_json
         FROM orders o
         LEFT JOIN users u ON u.id = o.user_id
         LEFT JOIN designs d ON d.id = o.design_id
        ORDER BY o.created_at DESC`,
    );
    return rows.map((r) => ({ ...r, design_json: parseJson(r.design_json) }));
  },
);

export interface AdminStats {
  total_orders: number;
  pending_orders: number;
  revenue_cents: number;
  total_customers: number;
}

/** Headline counts for the admin dashboard. Admin only. */
export const adminStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminStats> => {
    await requireAdmin();
    const [orders, customers] = await Promise.all([
      d1Query<{ total: number; pending: number; revenue: number }>(
        `SELECT COUNT(*) AS total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
                COALESCE(SUM(CASE WHEN status != 'cancelled' THEN price_cents ELSE 0 END), 0) AS revenue
           FROM orders`,
      ),
      d1Query<{ n: number }>("SELECT COUNT(*) AS n FROM users"),
    ]);
    const o = orders[0] ?? { total: 0, pending: 0, revenue: 0 };
    return {
      total_orders: o.total ?? 0,
      pending_orders: o.pending ?? 0,
      revenue_cents: o.revenue ?? 0,
      total_customers: customers[0]?.n ?? 0,
    };
  },
);

/** Move an order to a new fulfillment status. Admin only. */
export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
      status: z.enum(ORDER_STATUSES),
    }),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await requireAdmin();
    await d1Query("UPDATE orders SET status = ? WHERE id = ?", [data.status, data.id]);
    return { ok: true };
  });
