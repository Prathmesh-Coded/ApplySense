"use client";

import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AuthForm } from "@/components/auth-form";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/loading-screen";

export function ApplicationsDashboard() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function logout() {
    setSigningOut(true);
    setError("");
    const { error: signOutError } = await supabase.auth.signOut({
      scope: "local",
    });
    setSigningOut(false);

    if (signOutError) {
      setError("Could not sign out. Please try again.");
      return;
    }

  }

  if (session === undefined) return <LoadingScreen label="Checking your session" />;
  if (!session) return <AuthForm />;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
      <p className="text-muted-foreground">
        Manage your applications and view their status.
      </p>

      <Button
        disabled={signingOut}
        onClick={() => void logout()}
        className="h-11 w-[10vw] rounded-md bg-[#174d3b] text-white shadow-sm transition-colors hover:bg-[#103d2e]"
      >
        {signingOut ? "Logging out..." : "Logout"}
      </Button>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
