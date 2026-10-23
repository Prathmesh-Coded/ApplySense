"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

type RecoveryState = "waiting" | "ready" | "invalid" | "updated";

export function PasswordRecovery() {
  const router = useRouter();
  const [state, setState] = useState<RecoveryState>("waiting");

  useEffect(() => {
    let foundRecoverySession = false;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        foundRecoverySession = true;
        setState("ready");
      }
    });

    const timeout = window.setTimeout(() => {
      if (!foundRecoverySession) setState("invalid");
    }, 12000);

    return () => {
      window.clearTimeout(timeout);
      data.subscription.unsubscribe();
    };
  }, []);

  if (state === "ready") {
    return (
      <AuthForm
        onPasswordUpdated={() => setState("updated")}
        onRecoveryCancel={() => router.push("/")}
        recoveryMode
      />
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#e8eee8] px-5 py-10">
      <section className="w-full max-w-md rounded-lg border border-[#d5e0d7] bg-white p-7 text-center shadow-[0_18px_55px_rgba(35,66,48,0.12)]">
        <h1 className="font-heading text-2xl font-semibold text-[#1c2b23]">
          {state === "waiting"
            ? "Verifying reset link"
            : state === "updated"
              ? "Password updated"
              : "Reset link unavailable"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#68776e]">
          {state === "waiting"
            ? "Please wait while we verify your link."
            : state === "updated"
              ? "Your password has been changed. You can continue to ApplySense."
              : "This link may have expired or already been used. Request a new password reset link."}
        </p>
        {state !== "waiting" && (
          <Button
            className="mt-6 h-11 rounded-md bg-[#174d3b] px-5 text-white hover:bg-[#103d2e]"
            onClick={() => router.push("/")}
          >
            {state === "updated" ? "Continue" : "Back to sign in"}
          </Button>
        )}
      </section>
    </main>
  );
}
