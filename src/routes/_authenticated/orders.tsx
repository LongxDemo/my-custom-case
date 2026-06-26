import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { CaseSilhouette } from "@/components/CaseSilhouette";
import { CaseArtwork } from "@/components/CaseArtwork";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getModel, parseDesign } from "@/lib/studio";
import { listOrders, type OrderRecord } from "@/lib/data.functions";

export const Route = createFileRoute("/_authenticated/orders")({
  component: OrdersPage,
});

type OrderRow = OrderRecord;

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: { label: "In production", className: "bg-amber-100 text-amber-700" },
  processing: { label: "Processing", className: "bg-sky-100 text-sky-700" },
  shipped: { label: "Shipped", className: "bg-violet-100 text-violet-700" },
  delivered: { label: "Delivered", className: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelled", className: "bg-rose-100 text-rose-700" },
};

function OrdersPage() {
  const navigate = useNavigate();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async (): Promise<OrderRow[]> => (await listOrders()) as OrderRow[],
  });

  return (
    <AppShell
      header={
        <div className="px-6 pb-3 pt-8">
          <h1 className="text-2xl font-extrabold text-foreground">Orders</h1>
        </div>
      }
      contentClassName="px-6 pb-8"
    >
      {isLoading ? (
        <div className="space-y-3 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <EmptyState onStart={() => navigate({ to: "/select-device" })} />
      ) : (
        <div className="space-y-3 pt-2">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function OrderCard({ order }: { order: OrderRow }) {
  const design = order.design_json ? parseDesign(order.design_json) : null;
  const ratio = design ? getModel(design.modelId).ratio : 0.49;
  const status = STATUS_STYLES[order.status] ?? {
    label: order.status,
    className: "bg-muted text-muted-foreground",
  };
  const date = new Date(order.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
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
          {order.phone_model ?? "Phone case"}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <span
            className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", status.className)}
          >
            {status.label}
          </span>
          <span className="text-[11px] text-muted-foreground">{date}</span>
        </div>
      </div>
      <p className="shrink-0 text-sm font-bold text-foreground">
        ${((order.price_cents ?? 0) / 100).toFixed(2)}
      </p>
    </div>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 pt-20 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
        <Package className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="mt-6 text-base font-semibold text-foreground">No orders yet</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Once you order a case, you'll be able to track it here.
      </p>
      <div className="mt-6 w-full max-w-xs">
        <Button size="xl" onClick={onStart}>
          Start a design
        </Button>
      </div>
    </div>
  );
}
