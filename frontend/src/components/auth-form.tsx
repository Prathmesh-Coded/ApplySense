"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  BadgeDollarSign,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  ChartNoAxesCombined,
  CircleCheck,
  ClipboardCheck,
  Coins,
  CircleAlert,
  FileCheck2,
  HandCoins,
  MailCheck,
  ReceiptText,
  UserRoundCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

const backgroundIcons: {
  Icon: LucideIcon;
  x: number;
  y: number;
  size: number;
  rotation: number;
  color: string;
  mobileHidden?: boolean;
}[] = [
  {
    Icon: BriefcaseBusiness,
    x: 4,
    y: 45,
    size: 27,
    rotation: -13,
    color: "text-[#347158]",
  },
  {
    Icon: Coins,
    x: 12,
    y: 76,
    size: 23,
    rotation: 11,
    color: "text-[#a77b36]",
    mobileHidden: true,
  },
  {
    Icon: FileCheck2,
    x: 19,
    y: 27,
    size: 22,
    rotation: 8,
    color: "text-[#557d83]",
  },
  {
    Icon: BadgeDollarSign,
    x: 27,
    y: 68,
    size: 28,
    rotation: -8,
    color: "text-[#9a7943]",
  },
  {
    Icon: CalendarCheck,
    x: 35,
    y: 39,
    size: 21,
    rotation: 12,
    color: "text-[#477a63]",
    mobileHidden: true,
  },
  {
    Icon: Building2,
    x: 42,
    y: 82,
    size: 26,
    rotation: -7,
    color: "text-[#688279]",
  },
  {
    Icon: CircleCheck,
    x: 51,
    y: 23,
    size: 20,
    rotation: -14,
    color: "text-[#3b8061]",
    mobileHidden: true,
  },
  {
    Icon: Wallet,
    x: 58,
    y: 63,
    size: 25,
    rotation: 9,
    color: "text-[#a77b36]",
  },
  {
    Icon: MailCheck,
    x: 66,
    y: 34,
    size: 23,
    rotation: -9,
    color: "text-[#537985]",
    mobileHidden: true,
  },
  {
    Icon: ChartNoAxesCombined,
    x: 74,
    y: 80,
    size: 29,
    rotation: 7,
    color: "text-[#347158]",
  },
  {
    Icon: ClipboardCheck,
    x: 82,
    y: 48,
    size: 22,
    rotation: -11,
    color: "text-[#728675]",
  },
  {
    Icon: HandCoins,
    x: 91,
    y: 70,
    size: 27,
    rotation: 13,
    color: "text-[#a77b36]",
  },
  {
    Icon: BadgeCheck,
    x: 97,
    y: 27,
    size: 21,
    rotation: -6,
    color: "text-[#477a63]",
    mobileHidden: true,
  },
  {
    Icon: ReceiptText,
    x: 8,
    y: 13,
    size: 20,
    rotation: 10,
    color: "text-[#647f91]",
    mobileHidden: true,
  },
  {
    Icon: UserRoundCheck,
    x: 88,
    y: 11,
    size: 22,
    rotation: -12,
    color: "text-[#71885f]",
    mobileHidden: true,
  },
];

type AuthMode = "sign-in" | "sign-up" | "forgot-password" | "update-password";

type AuthFormProps = {
  recoveryMode?: boolean;
  onPasswordUpdated?: () => void;
  onRecoveryCancel?: () => void;
};

export function AuthForm({
  recoveryMode = false,
  onPasswordUpdated,
  onRecoveryCancel,
}: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>(
    recoveryMode ? "update-password" : "sign-in",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"error" | "notice">("error");
  const [busy, setBusy] = useState(false);
  const panelContentRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState<number | null>(null);

  useEffect(() => {
    const content = panelContentRef.current;
    if (!content) return;

    const observer = new ResizeObserver(([entry]) => {
      setPanelHeight(Math.ceil(entry.contentRect.height));
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      (mode === "sign-up" || mode === "update-password") &&
      password !== confirmPassword
    ) {
      setMessageKind("error");
      setMessage("Your passwords do not match.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      if (mode === "forgot-password") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) {
          setMessageKind("error");
          setMessage(error.message);
        } else {
          setMessageKind("notice");
          setMessage(
            "If an account exists for that email, password reset instructions will be sent. Check your inbox and spam folder.",
          );
        }
        return;
      }

      if (mode === "update-password") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          setMessageKind("error");
          setMessage(error.message);
        } else {
          onPasswordUpdated?.();
        }
        return;
      }

      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setMessageKind("error");
          setMessage(error.message);
        }
        return;
      }

      const result = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });

      if (result.error) {
        setMessageKind("error");
        setMessage(result.error.message);
      } else if (result.data.user?.identities?.length === 0) {
        setMessageKind("error");
        setMessage(
          "This email may already be registered. Try signing in or resetting your password.",
        );
      } else if (!result.data.session) {
        setMessageKind("notice");
        setMessage(
          "Check your inbox and spam folder for a confirmation link. If it doesn't arrive, configure custom SMTP in Supabase Auth; the default mailer only delivers to project team addresses.",
        );
      }
    } catch {
      setMessageKind("error");
      setMessage(
        "We couldn't reach the authentication service. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setConfirmPassword("");
    setPassword("");
    setMessage("");
  }

  const modeCopy: Record<AuthMode, { heading: string; description: string }> = {
    "sign-in": {
      heading: "Welcome back",
      description: "Pick up where your job search left off.",
    },
    "sign-up": {
      heading: "Create your account",
      description: "Set up your personal space for the next step.",
    },
    "forgot-password": {
      heading: "Reset your password",
      description: "We'll send a reset link if an account matches that email.",
    },
    "update-password": {
      heading: "Choose a new password",
      description: "Use at least 8 characters for your new password.",
    },
  };

  return (
    <main className="auth-canvas relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-[#e8eee8] px-4 py-10 sm:px-6">
      <div
        aria-hidden="true"
        className="auth-icon-field absolute inset-x-0 bottom-0 h-[65%] overflow-hidden"
      >
        {backgroundIcons.map(
          ({ Icon, x, y, size, rotation, color, mobileHidden }, index) => (
            <Icon
              aria-hidden="true"
              className={`auth-icon-float absolute ${color}${mobileHidden ? " hidden sm:block" : ""}`}
              key={`${x}-${y}`}
              size={size}
              strokeWidth={1.6}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                rotate: `${rotation}deg`,
                animationDelay: `${(index % 6) * -0.7}s`,
              }}
            />
          ),
        )}
      </div>

      <section className="relative z-10 w-full max-w-[420px]">
        <div className="mb-5 flex items-center justify-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-md bg-[#174d3b] text-white shadow-sm">
            <BriefcaseBusiness size={18} strokeWidth={2} aria-hidden="true" />
          </span>
          <span className="font-heading text-xl font-semibold text-[#19372b]">
            ApplySense
          </span>
        </div>

        <div className="rounded-lg border border-[#d5e0d7] bg-white px-5 py-6 shadow-[0_18px_55px_rgba(35,66,48,0.12)] sm:px-8 sm:py-8">
          <div
            className="auth-panel-height"
            style={
              panelHeight === null ? undefined : { height: `${panelHeight}px` }
            }
          >
            <div className="flow-root" ref={panelContentRef}>
              <div className="auth-mode-enter" key={mode}>
                <div className="text-center">
                  <p className="text-[11px] font-semibold uppercase text-[#557563]">
                    Your search, in good hands
                  </p>
                  <h1 className="mt-2 font-heading text-2xl font-semibold text-[#1c2b23] sm:text-[27px]">
                    {modeCopy[mode].heading}
                  </h1>
                  <p className="mx-auto mt-2 max-w-[310px] text-sm leading-5 text-[#68776e]">
                    {modeCopy[mode].description}
                  </p>
                </div>

                <form className="mt-6 space-y-4" onSubmit={submit}>
                  {mode !== "update-password" && (
                    <label className="block text-sm font-medium text-[#2d3b32]">
                      Email address
                      <input
                        autoComplete="email"
                        className="mt-1.5 h-11 w-full rounded-md border border-[#d3ddd5] bg-white px-3 text-[#1c2b23] outline-none transition-colors placeholder:text-[#98a49c] focus:border-[#438365] focus:ring-2 focus:ring-[#438365]/15"
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        required
                        type="email"
                        value={email}
                      />
                    </label>
                  )}
                  {mode !== "forgot-password" && (
                    <label className="block text-sm font-medium text-[#2d3b32]">
                      <span className="flex items-center justify-between">
                        <span>Password</span>
                        {mode === "sign-in" && (
                          <button
                            className="text-xs font-semibold text-[#205a40] underline decoration-[#9ab8a4] underline-offset-4"
                            onClick={() => switchMode("forgot-password")}
                            type="button"
                          >
                            Forgot password?
                          </button>
                        )}
                      </span>
                      <input
                        autoComplete={
                          mode === "sign-in"
                            ? "current-password"
                            : "new-password"
                        }
                        className="mt-1.5 h-11 w-full rounded-md border border-[#d3ddd5] bg-white px-3 text-[#1c2b23] outline-none transition-colors placeholder:text-[#98a49c] focus:border-[#438365] focus:ring-2 focus:ring-[#438365]/15"
                        minLength={8}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="At least 8 characters"
                        required
                        type="password"
                        value={password}
                      />
                    </label>
                  )}
                  {(mode === "sign-up" || mode === "update-password") && (
                    <label className="auth-confirm-enter block text-sm font-medium text-[#2d3b32]">
                      Confirm password
                      <input
                        autoComplete="new-password"
                        className="mt-1.5 h-11 w-full rounded-md border border-[#d3ddd5] bg-white px-3 text-[#1c2b23] outline-none transition-colors placeholder:text-[#98a49c] focus:border-[#438365] focus:ring-2 focus:ring-[#438365]/15"
                        minLength={8}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        placeholder="Re-enter your password"
                        required
                        type="password"
                        value={confirmPassword}
                      />
                    </label>
                  )}

                  <div className="min-h-3" aria-live="polite">
                    {message && (
                      <p
                        className={`flex items-start gap-1.5 text-sm leading-5 ${messageKind === "error" ? "text-[#a33b32]" : "text-[#315f44]"}`}
                        role={messageKind === "error" ? "alert" : "status"}
                      >
                        {messageKind === "error" && (
                          <CircleAlert
                            aria-hidden="true"
                            className="mt-0.5 shrink-0"
                            size={16}
                          />
                        )}
                        <span>{message}</span>
                      </p>
                    )}
                  </div>

                  <Button
                    className="h-11 w-full rounded-md bg-[#174d3b] text-white shadow-sm transition-colors hover:bg-[#103d2e]"
                    disabled={busy}
                    type="submit"
                  >
                    {
                      {
                        "sign-in": "Sign in",
                        "sign-up": "Create account",
                        "forgot-password": "Send reset link",
                        "update-password": "Update password",
                      }[mode]
                    }
                  </Button>
                </form>

                {mode === "sign-in" || mode === "sign-up" ? (
                  <p className="mt-5 text-center text-sm text-[#68776e]">
                    {mode === "sign-in"
                      ? "New to ApplySense?"
                      : "Already have an account?"}{" "}
                    <button
                      className="font-semibold text-[#205a40] underline decoration-[#9ab8a4] underline-offset-4 transition-colors hover:text-[#103d2e] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#438365] disabled:opacity-50"
                      disabled={busy}
                      onClick={() =>
                        switchMode(mode === "sign-in" ? "sign-up" : "sign-in")
                      }
                      type="button"
                    >
                      {mode === "sign-in" ? "Create an account" : "Sign in"}
                    </button>
                  </p>
                ) : (
                  <p className="mt-5 text-center text-sm text-[#68776e]">
                    <button
                      className="font-semibold text-[#205a40] underline decoration-[#9ab8a4] underline-offset-4 transition-colors hover:text-[#103d2e] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#438365]"
                      onClick={() =>
                        mode === "forgot-password"
                          ? switchMode("sign-in")
                          : onRecoveryCancel?.()
                      }
                      type="button"
                    >
                      Back to sign in
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-[#5f7165]">
          Your applications stay in your own workspace.
        </p>
      </section>
    </main>
  );
}
