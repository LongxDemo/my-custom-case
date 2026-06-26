import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getMe } from "@/lib/auth.functions";
import { AppShell } from "@/components/AppShell";
import { CaseSilhouette } from "@/components/CaseSilhouette";
import { CaseArtwork } from "@/components/CaseArtwork";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getModel, parseDesign } from "@/lib/studio";
import {
  adminListOrders,
  adminStats,
  adminUpdateOrderStatus,
  ORDER_STATUSES,
  type AdminOrderRecord,
  type OrderStatus,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  // _authenticated guarantees a session; here we additionally require admin.
  beforeLoad: async () => {
    const user = await getMe();
    if (!user?.is_admin) throw redirect({ to: "/" });
  },
  component: AdminPage,
});

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function AdminPage() {
  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminStats(),
  });
  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => adminListOrders(),
  });

  return (
    <AppShell
      header={
        <div className="px-6 pb-3 pt-8">
          <h1 className="text-2xl font-extrabold text-foreground">Admin</h1>
          <p className="text-sm text-muted-foreground">Orders &amp; fulfillment</p>
        </div>
      }
      contentClassName="px-6 pb-8"
    >
      <div className="grid grid-cols-2 gap-3 pt-2">
        <StatCard label="Orders" value={stats ? String(stats.total_orders) : "—"} />
        <StatCard label="Pending" value={stats ? String(stats.pending_orders) : "—"} />
        <StatCard
          label="Revenue"
          value={stats ? `$${(stats.revenue_cents / 100).toFixed(2)}` : "—"}
        />
        <StatCard label="Customers" value={stats ? String(stats.total_customers) : "—"} />
      </div>

      <h2 className="mb-2 mt-7 text-sm font-bold text-foreground">All orders</h2>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
          No orders yet.
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <AdminOrderCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-foreground">{value}</p>
    </div>
  );
}

function AdminOrderCard({ order }: { order: AdminOrderRecord }) {
  const queryClient = useQueryClient();
  const design = order.design_json ? parseDesign(order.design_json) : null;
  const ratio = design ? getModel(design.modelId).ratio : 0.49;
  const date = new Date(order.created_at).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const mutation = useMutation({
    mutationFn: (status: OrderStatus) => adminUpdateOrderStatus({ data: { id: order.id, status } }),
    onSuccess: () => {
      toast.success("Order updated");
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Update failed"),
  });

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-xl bg-muted/40">
        <CaseSilhouette ratio={ratio} className="w-12" camera="none">
          {design ? <CaseArtwork design={design} /> : <div className="absolute inset-0 bg-muted" />}
        </CaseSilhouette>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {order.design_name ?? "Custom case"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {order.customer_email ?? "Unknown customer"}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {order.phone_model ?? "—"} · {date}
        </p>
        <div className="mt-2">
          <Select
            value={order.status}
            onValueChange={(v) => mutation.mutate(v as OrderStatus)}
            disabled={mutation.isPending}
          >
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="shrink-0 text-sm font-bold text-foreground">
        ${((order.price_cents ?? 0) / 100).toFixed(2)}
      </p>
    </div>
  );
}
