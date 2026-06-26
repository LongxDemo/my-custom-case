import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Share2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { createOrder, getDesign } from "@/lib/data.functions";
import { CaseSilhouette } from "@/components/CaseSilhouette";
import { CaseArtwork } from "@/components/CaseArtwork";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CASE_BASE_PRICE_CENTS, backgroundToCss, getModel, parseDesign } from "@/lib/studio";

export const Route = createFileRoute("/_authenticated/preview")({
  validateSearch: (search: Record<string, unknown>): { id?: string } => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  component: PreviewPage,
});

type View = "back" | "front";

function PreviewPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("back");

  const { data, isLoading } = useQuery({
    queryKey: ["design", id],
    enabled: Boolean(id),
    queryFn: async () => getDesign({ data: { id: id! } }),
  });

  const order = useMutation({
    mutationFn: async () => {
      if (!data) throw new Error("Not ready");
      await createOrder({
        data: {
          design_id: data.id,
          phone_model: data.phone_model,
          price_cents: CASE_BASE_PRICE_CENTS,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order placed! Track it under Orders.");
      navigate({ to: "/orders" });
    },
    onError: () => toast.error("Couldn't place the order."),
  });

  const share = async () => {
    const text = `Check out the phone case I designed on CaseCraft — "${data?.name ?? "My design"}" 🎨`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "CaseCraft", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Preview message copied to clipboard");
      }
    } catch {
      /* user dismissed the share sheet — no-op */
    }
  };

  const design = data ? parseDesign(data.design_json) : null;
  const model = design ? getModel(design.modelId) : null;

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#1b1726] to-[#0d0b14]">
      {/* Top bar */}
      <header className="flex shrink-0 items-center gap-2 px-4 pt-8 pb-2">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back to studio"
          className="text-white hover:bg-white/10 hover:text-white"
          onClick={() => navigate({ to: "/studio", search: id ? { id } : {} })}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="flex-1 truncate text-base font-semibold text-white">
          {data?.name ?? "Preview"}
        </h1>
        <SegmentedToggle view={view} onChange={setView} />
      </header>

      {/* Stage */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-10 py-4">
        {/* Glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute h-72 w-72 rounded-full blur-3xl"
          style={{
            background: design ? backgroundToCss(design.background) : "#7c3aed",
            opacity: 0.35,
          }}
        />

        {isLoading || !design || !model ? (
          <Skeleton className="h-[60vh] w-[55vw] max-w-[230px] rounded-[2.5rem] bg-white/10" />
        ) : view === "back" ? (
          <CaseSilhouette
            ratio={model.ratio}
            camera={design.showCamera ? "lenses" : "blank"}
            className="relative max-h-full"
            style={{ width: "min(62vw, 240px)" }}
          >
            <CaseArtwork design={design} />
          </CaseSilhouette>
        ) : (
          <PhoneFront colorCss={backgroundToCss(design.background)} ratio={model.ratio} />
        )}

        {/* Corner thumbnail of their design */}
        {design && model && (
          <div className="absolute bottom-4 right-4 rounded-xl border border-white/15 bg-white/10 p-1.5 backdrop-blur">
            <CaseSilhouette ratio={model.ratio} className="w-12" camera="none">
              <CaseArtwork design={design} />
            </CaseSilhouette>
          </div>
        )}
      </div>

      {/* CTAs */}
      <div className="shrink-0 space-y-3 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
        <Button
          size="xl"
          className="gap-2"
          disabled={order.isPending || !data}
          onClick={() => order.mutate()}
        >
          {order.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ShoppingBag className="h-5 w-5" />
          )}
          {order.isPending
            ? "Placing order…"
            : `Order Now · $${(CASE_BASE_PRICE_CENTS / 100).toFixed(2)}`}
        </Button>
        <Button
          size="xl"
          variant="outline"
          className="gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          onClick={share}
        >
          <Share2 className="h-5 w-5" />
          Share Preview
        </Button>
      </div>
    </div>
  );
}

function SegmentedToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div className="flex rounded-full bg-white/10 p-0.5 text-sm font-medium">
      {(["front", "back"] as const).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cn(
            "rounded-full px-3.5 py-1 capitalize transition-colors",
            view === v ? "bg-white text-foreground" : "text-white/70",
          )}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

/** A simple front-of-phone mockup: the case rim wraps the bezel, screen shows a tinted wallpaper. */
function PhoneFront({ colorCss, ratio }: { colorCss: string; ratio: number }) {
  return (
    <div
      className="relative max-h-full"
      style={{
        aspectRatio: String(ratio),
        width: "min(62vw, 240px)",
        filter: "drop-shadow(0 22px 30px rgba(0,0,0,0.5))",
      }}
    >
      {/* Case rim (colored, peeking around the edges) */}
      <div className="absolute inset-0 rounded-[14%/7%] p-[3%]" style={{ background: colorCss }}>
        {/* Black bezel */}
        <div
          className="relative h-full w-full overflow-hidden rounded-[12%/6%] p-[3%]"
          style={{
            background: "linear-gradient(150deg,#202024,#050506)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
          }}
        >
          {/* Screen */}
          <div
            className="relative h-full w-full overflow-hidden rounded-[10%/5%]"
            style={{ background: colorCss }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />
            {/* Status time */}
            <span className="absolute left-[10%] top-[3%] text-[9px] font-semibold text-white/90">
              9:41
            </span>
            {/* Dynamic island */}
            <div className="absolute left-1/2 top-[3.5%] h-[5%] w-[28%] -translate-x-1/2 rounded-full bg-black" />
            {/* Glossy reflection */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(125deg,rgba(255,255,255,0.30) 0%,rgba(255,255,255,0.06) 20%,rgba(255,255,255,0) 42%)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
