import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.display_name ?? "CaseCraft user";

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  return (
    <AppShell
      header={
        <div className="px-6 pb-3 pt-8">
          <h1 className="text-2xl font-extrabold text-foreground">Profile</h1>
        </div>
      }
      contentClassName="px-6 pb-8"
    >
      <div className="flex flex-col items-center pt-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-2xl font-bold text-primary">
          {(user?.display_name ?? user?.email ?? "?").charAt(0).toUpperCase()}
        </div>
        <p className="mt-4 text-lg font-bold text-foreground">{displayName}</p>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <div className="mt-8 space-y-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Display name
          </p>
          <p className="mt-1 text-sm text-foreground">{displayName}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</p>
          <p className="mt-1 text-sm text-foreground">{user?.email}</p>
        </div>
      </div>

      {user?.is_admin ? (
        <Link
          to="/admin"
          className="mt-8 flex items-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm font-semibold text-foreground"
        >
          <ShieldCheck className="h-4 w-4 text-primary" />
          Admin dashboard
        </Link>
      ) : null}

      <Button
        variant="outline"
        size="xl"
        className="mt-4 gap-2 text-destructive"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </AppShell>
  );
}
