import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ShoppingBag, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { CaseSilhouette } from "@/components/CaseSilhouette";
import { CaseArtwork } from "@/components/CaseArtwork";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CASE_BASE_PRICE_CENTS, getModel, parseDesign, type DesignState } from "@/lib/studio";

export const Route = createFileRoute("/_authenticated/designs")({
  component: DesignsPage,
});

interface DesignRow {
  id: string;
  name: string;
  phone_model: string | null;
  platform: string | null;
  design_json: unknown;
  created_at: string;
}

function DesignsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [pendingDelete, setPendingDelete] = useState<DesignRow | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const { data: designs, isLoading } = useQuery({
    queryKey: ["designs"],
    queryFn: async (): Promise<DesignRow[]> => {
      const { data, error } = await supabase
        .from("designs")
        .select("id, name, phone_model, platform, design_json, created_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DesignRow[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("designs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designs"] });
      toast.success("Design deleted");
    },
    onError: () => toast.error("Couldn't delete that design."),
    onSettled: () => setPendingDelete(null),
  });

  const reorderMutation = useMutation({
    mutationFn: async (design: DesignRow) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("orders").insert({
        user_id: user.id,
        design_id: design.id,
        phone_model: design.phone_model,
        status: "pending",
        price_cents: CASE_BASE_PRICE_CENTS,
      });
      if (error) throw error;
    },
    onMutate: (design) => setReorderingId(design.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order placed! Track it under Orders.");
      navigate({ to: "/orders" });
    },
    onError: () => toast.error("Couldn't place the order."),
    onSettled: () => setReorderingId(null),
  });

  const newDesign = () => navigate({ to: "/select-device" });
  const editDesign = (id: string) => navigate({ to: "/studio", search: { id } });

  return (
    <AppShell
      header={
        <div className="flex items-center justify-between px-6 pb-3 pt-8">
          <h1 className="text-2xl font-extrabold text-foreground">My designs</h1>
          <Button size="sm" className="h-9 gap-1 rounded-xl px-3" onClick={newDesign}>
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
      }
      contentClassName="px-6 pb-8"
    >
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[0.62] w-full rounded-2xl" />
          ))}
        </div>
      ) : !designs || designs.length === 0 ? (
        <EmptyState onStart={newDesign} />
      ) : (
        <div className="grid grid-cols-2 gap-4 pt-2">
          {designs.map((d) => (
            <DesignCard
              key={d.id}
              design={d}
              onEdit={() => editDesign(d.id)}
              onReorder={() => reorderMutation.mutate(d)}
              reordering={reorderingId === d.id}
              onDelete={() => setPendingDelete(d)}
            />
          ))}
        </div>
      )}

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this design?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingDelete?.name}” will be permanently removed. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function DesignCard({
  design,
  onEdit,
  onReorder,
  reordering,
  onDelete,
}: {
  design: DesignRow;
  onEdit: () => void;
  onReorder: () => void;
  reordering: boolean;
  onDelete: () => void;
}) {
  const state: DesignState = parseDesign(design.design_json);
  const ratio = getModel(state.modelId).ratio;
  return (
    <div className="rounded-2xl border border-border bg-card p-2.5">
      <div className="relative">
        <button
          onClick={onEdit}
          className="flex w-full items-center justify-center rounded-xl bg-muted/40 px-2 py-3"
          aria-label={`Edit ${design.name}`}
        >
          <CaseSilhouette ratio={ratio} className="w-[78%]">
            <CaseArtwork design={state} />
          </CaseSilhouette>
        </button>
        <button
          onClick={onDelete}
          aria-label={`Delete ${design.name}`}
          className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-lg bg-card/90 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-2 truncate px-0.5 text-sm font-semibold text-foreground">{design.name}</p>
      <p className="truncate px-0.5 text-xs text-muted-foreground">
        {design.phone_model ?? "Phone case"}
      </p>
      <div className="mt-2 flex gap-1.5">
        <Button
          size="sm"
          variant="outline"
          className="h-8 flex-1 rounded-lg px-0 text-xs"
          onClick={onEdit}
        >
          Edit
        </Button>
        <Button
          size="sm"
          className="h-8 flex-1 gap-1 rounded-lg px-0 text-xs"
          onClick={onReorder}
          disabled={reordering}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          {reordering ? "…" : "Reorder"}
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 pt-16 text-center">
      <CaseSilhouette className="w-36" ratio={0.5} dashed showCamera={false}>
        <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-muted-foreground/50" />
      </CaseSilhouette>
      <p className="mt-6 text-base font-semibold text-foreground">
        No designs yet — start creating!
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Your saved case designs will show up here.
      </p>
      <div className="mt-6 w-full max-w-xs">
        <Button size="xl" onClick={onStart}>
          Start a design
        </Button>
      </div>
    </div>
  );
}
