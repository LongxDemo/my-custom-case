import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  /** Optional sticky header rendered above the scroll area. */
  header?: ReactNode;
  /** Hide bottom navigation (e.g. auth screen). */
  hideNav?: boolean;
  contentClassName?: string;
}

/** Full-height column: optional header, scrollable content, persistent bottom nav. */
export function AppShell({ children, header, hideNav = false, contentClassName }: AppShellProps) {
  return (
    <div className="flex h-full flex-col bg-background">
      {header}
      <main className={cn("no-scrollbar flex-1 overflow-y-auto", contentClassName)}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
