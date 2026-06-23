import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Search } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { CaseSilhouette } from "@/components/CaseSilhouette";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PHONE_MODELS, getModel, type Platform } from "@/lib/studio";

export const Route = createFileRoute("/_authenticated/select-device")({
  head: () => ({ meta: [{ title: "Choose Your Device · CaseCraft" }] }),
  component: SelectDevicePage,
});

const PLATFORM_TINT: Record<Platform, string> = {
  iOS: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)",
  Android: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
};

function SelectDevicePage() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<Platform>("iOS");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(
    PHONE_MODELS.find((m) => m.platform === "iOS")!.id,
  );

  const models = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PHONE_MODELS.filter(
      (m) => m.platform === platform && (!q || m.label.toLowerCase().includes(q)),
    );
  }, [platform, query]);

  const selected = getModel(selectedId);

  const choosePlatform = (p: Platform) => {
    setPlatform(p);
    setQuery("");
    const first = PHONE_MODELS.find((m) => m.platform === p);
    if (first) setSelectedId(first.id);
  };

  const start = () => navigate({ to: "/studio", search: { model: selectedId } });

  return (
    <AppShell
      header={
        <div className="flex items-center gap-2 px-4 pb-3 pt-8">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Back"
            onClick={() => navigate({ to: "/" })}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Choose Your Device</h1>
        </div>
      }
      contentClassName="flex flex-col px-5 pb-4"
    >
      {/* Platform cards, side by side */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {(["iOS", "Android"] as const).map((p) => (
          <PlatformCard
            key={p}
            platform={p}
            active={platform === p}
            onClick={() => choosePlatform(p)}
          />
        ))}
      </div>

      {/* Search */}
      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${platform} models…`}
          aria-label="Search phone models"
          className="h-11 rounded-xl bg-card pl-9"
        />
      </div>

      {/* List + live preview */}
      <div className="mt-4 flex min-h-0 flex-1 gap-3">
        {/* Scrollable model list */}
        <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pb-2">
          {models.length === 0 ? (
            <p className="px-1 pt-6 text-sm text-muted-foreground">No models match “{query}”.</p>
          ) : (
            models.map((m) => {
              const isSel = m.id === selectedId;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors",
                    isSel ? "border-primary bg-primary/5" : "border-border bg-card",
                  )}
                >
                  <CaseSilhouette
                    ratio={m.ratio}
                    className="h-12 w-auto shrink-0"
                    showCamera={false}
                  >
                    <div
                      className="absolute inset-0"
                      style={{ background: PLATFORM_TINT[m.platform] }}
                    />
                  </CaseSilhouette>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.size}</p>
                  </div>
                  {isSel && (
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Live preview, on the right */}
        <div className="flex w-32 shrink-0 flex-col items-center rounded-2xl border border-border bg-card p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Preview
          </p>
          <CaseSilhouette ratio={selected.ratio} className="mt-2 w-20">
            <div
              className="absolute inset-0"
              style={{ background: PLATFORM_TINT[selected.platform] }}
            />
          </CaseSilhouette>
          <p className="mt-2 text-center text-xs font-semibold leading-tight text-foreground">
            {selected.label}
          </p>
          <p className="text-[11px] text-muted-foreground">{selected.size}</p>
        </div>
      </div>

      <Button size="xl" className="mt-3 shrink-0" onClick={start}>
        Design for {selected.label}
      </Button>
    </AppShell>
  );
}

function PlatformCard({
  platform,
  active,
  onClick,
}: {
  platform: Platform;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all active:scale-[0.98]",
        active ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card",
      )}
    >
      <span
        className="grid h-12 w-12 place-items-center rounded-xl text-white"
        style={{ background: PLATFORM_TINT[platform] }}
        aria-hidden
      >
        {platform === "iOS" ? <AppleGlyph /> : <AndroidGlyph />}
      </span>
      <span className="text-sm font-bold text-foreground">{platform}</span>
      <span className="text-[11px] text-muted-foreground">
        {platform === "iOS" ? "iPhone" : "Samsung, Pixel & more"}
      </span>
    </button>
  );
}

function AppleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
      <path d="M16.4 12.7c0-2.2 1.8-3.3 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.4 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.4 1.1 8.5.7 1 1.5 2.2 2.6 2.1 1-.04 1.4-.7 2.7-.7 1.3 0 1.6.7 2.7.6 1.1-.02 1.8-1 2.5-2 .8-1.2 1.1-2.3 1.1-2.4-.02-.01-2.1-.8-2.1-3.2zM14.2 5.9c.6-.7 1-1.7.9-2.7-.9.04-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6 1 .07 1.9-.5 2.5-1.2z" />
    </svg>
  );
}

function AndroidGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
      <path d="M6 9v7a1 1 0 0 0 1 1h1v3a1 1 0 1 0 2 0v-3h4v3a1 1 0 1 0 2 0v-3h1a1 1 0 0 0 1-1V9H6zM4.5 9A1.5 1.5 0 0 0 3 10.5v4a1.5 1.5 0 0 0 3 0v-4A1.5 1.5 0 0 0 4.5 9zm15 0a1.5 1.5 0 0 0-1.5 1.5v4a1.5 1.5 0 0 0 3 0v-4A1.5 1.5 0 0 0 19.5 9zM15.6 4l1-1.5a.3.3 0 0 0-.5-.3l-1 1.6A6.3 6.3 0 0 0 12 3.2c-1.1 0-2.1.2-3 .6L8 2.2a.3.3 0 0 0-.5.3l1 1.5A5.3 5.3 0 0 0 6 8.2h12a5.3 5.3 0 0 0-2.4-4.2zM9.5 6.6a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4zm5 0a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4z" />
    </svg>
  );
}
