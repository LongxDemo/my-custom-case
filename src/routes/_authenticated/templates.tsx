import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { CaseSilhouette } from "@/components/CaseSilhouette";
import { CaseArtwork } from "@/components/CaseArtwork";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TEMPLATES, getModel, type Template } from "@/lib/studio";

export const Route = createFileRoute("/_authenticated/templates")({
  head: () => ({
    meta: [{ title: "Browse Templates · CaseCraft" }],
  }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState<string>("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(TEMPLATES.map((t) => t.category)))],
    [],
  );
  const visible = active === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.category === active);

  const openTemplate = (t: Template) => navigate({ to: "/studio", search: { template: t.id } });

  return (
    <AppShell
      header={
        <div className="px-6 pb-2 pt-8">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Back"
              onClick={() => navigate({ to: "/" })}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-extrabold leading-none text-foreground">Templates</h1>
              <p className="mt-1 text-sm text-muted-foreground">Tap a design to make it yours.</p>
            </div>
          </div>

          <div className="no-scrollbar -mx-6 mt-4 flex gap-2 overflow-x-auto px-6 pb-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  active === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      }
      contentClassName="px-6 pb-8"
    >
      <div className="grid grid-cols-2 gap-4 pt-2">
        {visible.map((t) => (
          <TemplateCard key={t.id} template={t} onClick={() => openTemplate(t)} />
        ))}
      </div>
    </AppShell>
  );
}

function TemplateCard({ template, onClick }: { template: Template; onClick: () => void }) {
  const ratio = getModel(template.design.modelId).ratio;
  return (
    <button
      onClick={onClick}
      className="group rounded-2xl border border-border bg-card p-2.5 text-left transition-transform active:scale-[0.98]"
    >
      <div className="flex items-center justify-center rounded-xl bg-muted/40 px-2 py-3">
        <CaseSilhouette ratio={ratio} className="w-[78%]">
          <CaseArtwork design={template.design} />
        </CaseSilhouette>
      </div>
      <p className="mt-2 truncate px-0.5 text-sm font-semibold text-foreground">{template.name}</p>
      <p className="truncate px-0.5 text-xs text-muted-foreground">{template.category}</p>
    </button>
  );
}
