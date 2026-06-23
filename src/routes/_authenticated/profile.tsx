import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

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
          {(profile?.display_name ?? user?.email ?? "?").charAt(0).toUpperCase()}
        </div>
        {isLoading ? (
          <Skeleton className="mt-4 h-6 w-32 rounded" />
        ) : (
          <p className="mt-4 text-lg font-bold text-foreground">
            {profile?.display_name ?? "CaseCraft user"}
          </p>
        )}
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <div className="mt-8 space-y-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Display name
          </p>
          <p className="mt-1 text-sm text-foreground">{profile?.display_name ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</p>
          <p className="mt-1 text-sm text-foreground">{user?.email}</p>
        </div>
      </div>

      <Button
        variant="outline"
        size="xl"
        className="mt-8 gap-2 text-destructive"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </AppShell>
  );
}
