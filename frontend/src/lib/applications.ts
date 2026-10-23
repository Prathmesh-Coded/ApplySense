import { supabase } from "@/lib/supabase/client";

export const applicationStatuses = [
  "applied",
  "screening",
  "interview",
  "offer",
  "onboarding",
  "active",
  "rejected",
] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

export type Application = {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  source: "manual" | "gmail-sync";
  applied_date: string | null;
  created_at: string;
  updated_at: string;
};

export type ApplicationInput = {
  company: string;
  role: string;
  status: ApplicationStatus;
  applied_date: string | null;
};

export async function applicationRequest<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<T> {
  const send = (token: string) =>
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });

  let response = await send(accessToken);

  if (response.status === 401) {
    const refreshed = await supabase.auth.refreshSession().catch(() => null);
    if (!refreshed || refreshed.error || !refreshed.data.session) {
      throw new Error(
        "Your session could not be refreshed. Check your connection, then try again or sign out and back in.",
      );
    }

    response = await send(refreshed.data.session.access_token);
    if (response.status === 401) {
      throw new Error(
        "The API rejected the refreshed session. Check the backend JWT configuration.",
      );
    }
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      detail?: string;
    } | null;
    throw new Error(payload?.detail ?? "The request could not be completed.");
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
