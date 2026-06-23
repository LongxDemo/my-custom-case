import { Link } from "@tanstack/react-router";
import { Home, LayoutGrid, Package, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/designs", label: "My designs", icon: LayoutGrid },
  { to: "/orders", label: "Orders", icon: Package },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  return (
    <nav className="shrink-0 border-t border-border bg-card/90 backdrop-blur">
      <ul className="flex items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {tabs.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="group flex flex-col items-center gap-1 rounded-xl py-1.5 text-muted-foreground transition-colors"
              activeProps={{ "data-active": "true" }}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")}
                    strokeWidth={isActive ? 2.4 : 1.9}
                  />
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {label}
                  </span>
                </>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
