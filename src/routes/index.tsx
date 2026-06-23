import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { CaseLogo } from "@/components/CaseLogo";
import { CaseSilhouette } from "@/components/CaseSilhouette";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CaseCraft — Your phone. Your canvas." },
      {
        name: "description",
        content:
          "Design a custom phone case with your own photos, text, stickers and colors, then order it. Start designing with CaseCraft.",
      },
      { property: "og:title", content: "CaseCraft — Your phone. Your canvas." },
      {
        property: "og:description",
        content: "Design a custom phone case with your own photos, text, stickers and colors.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();

  return (
    <AppShell contentClassName="px-6">
      <div className="flex min-h-full flex-col">
        <header className="flex justify-center pt-8">
          <CaseLogo size={26} />
        </header>

        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <h1 className="text-[2rem] font-extrabold leading-tight text-foreground">
            Your phone.
            <br />
            Your canvas.
          </h1>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Design a one-of-a-kind case with your photos, text, stickers and colors — then order it.
          </p>

          <CaseSilhouette className="mt-10 w-48" ratio={0.5}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary to-[#5b21b6]">
              <div className="absolute -right-8 top-1/4 h-28 w-28 rounded-full bg-white/20" />
              <div className="absolute bottom-8 left-3 h-14 w-14 rounded-full bg-white/20" />
              <Sparkles className="absolute bottom-5 right-5 h-6 w-6 text-white/90" />
            </div>
          </CaseSilhouette>
        </div>

        <div className="space-y-3 pb-8">
          <Button size="xl" onClick={() => navigate({ to: "/select-device" })}>
            Start Designing
          </Button>
          <Button size="xl" variant="outline" onClick={() => navigate({ to: "/templates" })}>
            Browse Templates
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
