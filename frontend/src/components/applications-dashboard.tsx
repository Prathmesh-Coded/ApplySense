"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Circle,
  LogOut,
  Mail,
  Pencil,
  PenLine,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { AuthForm } from "@/components/auth-form";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DeleteApplicationDialog } from "@/components/delete-application-dialog";
import { LoadingScreen } from "@/components/loading-screen";
import { Button } from "@/components/ui/button";
import {
  applicationRequest,
  applicationStatuses,
  type Application,
  type ApplicationInput,
  type ApplicationStatus,
} from "@/lib/applications";
import { supabase } from "@/lib/supabase/client";

const statusLabels: Record<ApplicationStatus, string> = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  onboarding: "Onboarding",
  active: "Active",
  rejected: "Closed",
};

const statusTheme: Record<
  ApplicationStatus,
  {
    dot: string;
    tag: string;
  }
> = {
  applied: {
    dot: "bg-[#4E82F5]",
    tag: "border-[#B9CCFF] bg-[#EAF0FF] text-[#1C50C5]",
  },
  screening: {
    dot: "bg-[#19A47A]",
    tag: "border-[#AEE3D1] bg-[#E5F7F0] text-[#087155]",
  },
  interview: {
    dot: "bg-[#F3A52D]",
    tag: "border-[#F6D59B] bg-[#FFF5DF] text-[#9B5A00]",
  },
  offer: {
    dot: "bg-[#D95CBE]",
    tag: "border-[#EFC2E5] bg-[#FCECF8] text-[#9A327F]",
  },
  onboarding: {
    dot: "bg-[#9863E6]",
    tag: "border-[#D7C2F7] bg-[#F2ECFF] text-[#63419A]",
  },
  active: {
    dot: "bg-[#0E7B68]",
    tag: "border-[#A8D9CE] bg-[#E4F5F0] text-[#075E51]",
  },
  rejected: {
    dot: "bg-[#A0A8BB]",
    tag: "border-[#D9DFE8] bg-[#F2F4F7] text-[#5C6576]",
  },
};

const routeStages: ApplicationStatus[] = [
  "applied",
  "screening",
  "interview",
  "offer",
  "onboarding",
  "active",
];

const APPLICATIONS_PER_PAGE = 10;

function emptyApplicationInput(): ApplicationInput {
  const today = new Date();
  const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 10);

  return {
    company: "",
    role: "",
    status: "applied",
    applied_date: localDate,
  };
}

function formatDate(value: string | null) {
  if (!value) return "Date not set";
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function countForStatus(
  applications: Application[],
  status: ApplicationStatus,
) {
  return applications.filter((application) => application.status === status)
    .length;
}

export function ApplicationsDashboard() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const sessionRef = useRef<Session | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [editorError, setEditorError] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [form, setForm] = useState<ApplicationInput>(emptyApplicationInput);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">(
    "all",
  );
  const [sourceFilter, setSourceFilter] = useState<
    Application["source"] | "all"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      sessionRef.current = nextSession;
      setSession(nextSession);
      if (!nextSession) setApplications([]);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const loadApplications = useCallback(async (currentSession: Session) => {
    setLoading(true);
    setError("");
    try {
      const rows = await applicationRequest<Application[]>(
        "/applications",
        currentSession.access_token,
      );
      if (sessionRef.current?.user.id === currentSession.user.id) {
        setApplications(rows);
      }
    } catch (requestError) {
      if (sessionRef.current?.user.id === currentSession.user.id) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Could not load applications.",
        );
      }
    } finally {
      if (sessionRef.current?.user.id === currentSession.user.id) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    void Promise.resolve().then(() => loadApplications(session));
  }, [loadApplications, session]);

  useEffect(() => {
    if (!editorOpen && !settingsOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || saving) return;
      setEditorOpen(false);
      setSettingsOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [editorOpen, saving, settingsOpen]);

  function openCreate() {
    setFeedback("");
    setEditing(null);
    setForm(emptyApplicationInput());
    setEditorError("");
    setEditorOpen(true);
  }

  function openEdit(application: Application) {
    setFeedback("");
    setEditing(application);
    setForm({
      company: application.company,
      role: application.role,
      status: application.status,
      applied_date: application.applied_date,
    });
    setEditorError("");
    setEditorOpen(true);
  }

  async function saveApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;

    setSaving(true);
    setEditorError("");
    const payload = {
      ...form,
      company: form.company.trim(),
      role: form.role.trim(),
      applied_date: form.applied_date || null,
    };

    try {
      await applicationRequest<Application>(
        editing ? `/applications/${editing.id}` : "/applications",
        session.access_token,
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      setEditorOpen(false);
      setFeedback(
        editing
          ? "Changes saved. Your application tracker is current."
          : "Application added to your tracker.",
      );
      await loadApplications(session);
    } catch (requestError) {
      setEditorError(
        requestError instanceof Error
          ? requestError.message
          : "Could not save this application.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(
    application: Application,
    status: ApplicationStatus,
  ) {
    if (!session) return;
    setError("");
    setFeedback("");
    try {
      const updated = await applicationRequest<Application>(
        `/applications/${application.id}`,
        session.access_token,
        { method: "PATCH", body: JSON.stringify({ status }) },
      );
      setApplications((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setFeedback(
        `${application.company} moved to ${statusLabels[status].toLowerCase()}.`,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not update application status.",
      );
    }
  }

  async function deleteApplication(application: Application) {
    if (!session) {
      return;
    }

    setDeletingId(application.id);
    setError("");
    setFeedback("");
    try {
      await applicationRequest<void>(
        `/applications/${application.id}`,
        session.access_token,
        { method: "DELETE" },
      );
      setApplications((current) =>
        current.filter((item) => item.id !== application.id),
      );
      setFeedback(`${application.company} removed from your applications.`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not delete this application.",
      );
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  }

  async function logout() {
    setSigningOut(true);
    setError("");
    const { error: signOutError } = await supabase.auth.signOut({
      scope: "local",
    });
    setSigningOut(false);
    if (signOutError) setError("Could not sign out. Please try again.");
  }

  const filteredApplications = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          application.company,
          application.role,
          application.status,
          application.source,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "all" || application.status === statusFilter;
      const matchesSource =
        sourceFilter === "all" || application.source === sourceFilter;

      return matchesQuery && matchesStatus && matchesSource;
    });
  }, [applications, searchQuery, sourceFilter, statusFilter]);
  const pageCount = Math.max(
    1,
    Math.ceil(filteredApplications.length / APPLICATIONS_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const visibleApplications = useMemo(() => {
    const start = (safeCurrentPage - 1) * APPLICATIONS_PER_PAGE;
    return filteredApplications.slice(start, start + APPLICATIONS_PER_PAGE);
  }, [filteredApplications, safeCurrentPage]);

  function updateSearchQuery(value: string) {
    setSearchQuery(value);
    setCurrentPage(1);
  }

  function updateStatusFilter(value: ApplicationStatus | "all") {
    setStatusFilter(value);
    setCurrentPage(1);
  }

  function updateSourceFilter(value: Application["source"] | "all") {
    setSourceFilter(value);
    setCurrentPage(1);
  }

  if (session === undefined) {
    return <LoadingScreen label="Checking your session" />;
  }
  if (!session) return <AuthForm />;

  const inProgressCount = applications.filter(
    (application) => application.status !== "rejected",
  ).length;
  const interviewCount = countForStatus(applications, "interview");
  const offerCount = countForStatus(applications, "offer");

  return (
    <main className="min-h-svh bg-[#F4F0E7] text-[#182334]">
      <div className="dashboard-shell mx-auto min-h-svh max-w-full md:grid md:grid-cols-[248px_minmax(0,1fr)]">
        <DashboardSidebar
          onLogout={() => void logout()}
          onSettings={() => setSettingsOpen(true)}
          signingOut={signingOut}
          stages={routeStages.map((stage) => ({
            label: statusLabels[stage],
            count: countForStatus(applications, stage),
            dot: statusTheme[stage].dot,
          }))}
        />

        <div className="min-w-0 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
          <header className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <h1 className="font-heading text-4xl font-bold leading-[0.94] tracking-[-0.045em] text-[#182334] sm:text-6xl">
                Your search,
                <span className="block text-[#C88800]">in motion.</span>
              </h1>
              <p
                aria-live="polite"
                className={`mt-5 min-h-6 max-w-xl text-sm leading-6 text-[#5B6572]${feedback ? " atlas-feedback" : ""}`}
                role="status"
              >
                {feedback ||
                  `${inProgressCount} active · ${interviewCount} ${interviewCount === 1 ? "interview" : "interviews"} · ${offerCount} ${offerCount === 1 ? "offer" : "offers"}`}
              </p>
            </div>

            <Button
              className="h-11 rounded-none bg-[#F2C94C] px-5 font-bold text-[#182334] shadow-[0_8px_0_#C88800] transition-transform hover:-translate-y-0.5 hover:bg-[#FFD866] hover:shadow-[0_10px_0_#C88800]"
              onClick={openCreate}
            >
              <Plus aria-hidden="true" /> Add application
            </Button>
          </header>

          {error && (
            <div
              className="mt-8 flex items-start justify-between gap-3 border border-[#DCA39B] bg-[#FFF1ED] px-4 py-3 text-sm text-[#963D31]"
              role="alert"
            >
              <span>{error}</span>
              <button
                aria-label="Dismiss error"
                className="shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[#A23429]/30"
                onClick={() => setError("")}
                type="button"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          )}

          <section
            aria-label="Applications at a glance"
            className="mt-10 overflow-hidden border-y-2 border-[#182334] bg-[#182334] text-white"
          >
            <div className="grid gap-px bg-[#455365] sm:grid-cols-3">
              {[
                {
                  label: "In motion",
                  value: inProgressCount,
                  detail: "applications open",
                  color: "text-[#B9C9D8]",
                },
                {
                  label: "At interview",
                  value: interviewCount,
                  detail: "conversations live",
                  color: "text-[#F2C94C]",
                },
                {
                  label: "Offers",
                  value: offerCount,
                  detail: "worth reviewing",
                  color: "text-[#F4A38F]",
                },
              ].map((item) => (
                <div
                  className="bg-[#182334] px-5 py-5 sm:px-6"
                  key={item.label}
                >
                  <p className={`text-sm font-medium ${item.color}`}>
                    {item.label}
                  </p>
                  <div className="mt-5 flex items-end justify-between gap-3">
                    <p className="font-heading text-4xl font-bold tabular-nums">
                      {item.value}
                    </p>
                    <p className="mb-1 text-right text-xs text-[#B9C3CE]">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section aria-label="Applications" className="mt-10" id="applications">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-heading text-2xl font-bold tracking-[-0.03em] text-[#182334]">
                  The departure board
                </h2>
                <p className="mt-1 text-sm text-[#66717E]">
                  Every application, with its current stage in view. Update
                  progress inline as your search moves forward.
                </p>
              </div>
              <span className="border border-[#C7BEAE] bg-[#EEE8DB] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] tabular-nums text-[#59626D]">
                {filteredApplications.length} of {applications.length}
              </span>
            </div>

            {loading ? (
              <div
                aria-label="Loading applications"
                className="mt-5 overflow-hidden border border-[#CFC8BA] bg-[#FBF9F4]"
                role="status"
              >
                {[0, 1, 2].map((row) => (
                  <div
                    className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-4 border-b border-[#E4DED3] p-4 last:border-b-0 sm:grid-cols-[52px_minmax(0,1fr)_150px_120px] sm:p-5"
                    key={row}
                  >
                    <div className="size-[52px] bg-[#EEE8DB] motion-safe:animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 max-w-52 rounded-sm bg-[#E4DED3] motion-safe:animate-pulse" />
                      <div className="h-3 w-28 rounded-sm bg-[#EEE8DB] motion-safe:animate-pulse" />
                    </div>
                    <div className="h-8 rounded-sm bg-[#E4DED3] motion-safe:animate-pulse" />
                    <div className="hidden h-4 rounded-sm bg-[#EEE8DB] motion-safe:animate-pulse sm:block" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="mt-5 grid gap-3 border-y border-[#CFC8BA] py-3 sm:grid-cols-[minmax(0,1fr)_170px_170px]">
                  <label className="relative block">
                    <span className="sr-only">Search applications</span>
                    <Search
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#89918D]"
                    />
                    <input
                      className="h-10 w-full rounded-none border border-[#CFC8BA] bg-[#FBF9F4] pl-9 pr-3 text-sm text-[#182334] outline-none placeholder:text-[#89918D] focus:border-[#C88800] focus:ring-2 focus:ring-[#F2C94C]/30"
                      onChange={(event) => updateSearchQuery(event.target.value)}
                      placeholder="Search company, role, or stage"
                      type="search"
                      value={searchQuery}
                    />
                  </label>
                  <label>
                    <span className="sr-only">Filter by application status</span>
                    <select
                      aria-label="Filter by application status"
                      className="h-10 w-full rounded-none border border-[#CFC8BA] bg-[#FBF9F4] px-3 text-sm font-semibold text-[#182334] outline-none focus:border-[#C88800] focus:ring-2 focus:ring-[#F2C94C]/30"
                      onChange={(event) =>
                        updateStatusFilter(
                          event.target.value as ApplicationStatus | "all",
                        )
                      }
                      value={statusFilter}
                    >
                      <option value="all">All stages</option>
                      {applicationStatuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="sr-only">Filter by application source</span>
                    <select
                      aria-label="Filter by application source"
                      className="h-10 w-full rounded-none border border-[#CFC8BA] bg-[#FBF9F4] px-3 text-sm font-semibold text-[#182334] outline-none focus:border-[#C88800] focus:ring-2 focus:ring-[#F2C94C]/30"
                      onChange={(event) =>
                        updateSourceFilter(
                          event.target.value as Application["source"] | "all",
                        )
                      }
                      value={sourceFilter}
                    >
                      <option value="all">All sources</option>
                      <option value="manual">Manual</option>
                      <option value="gmail-sync">Gmail sync</option>
                    </select>
                  </label>
                </div>

                {applications.length === 0 ? (
              <div className="relative mt-5 overflow-hidden border border-[#CFC8BA] bg-[#FBF9F4] px-6 py-14 text-center sm:px-10">
                <div className="absolute inset-x-0 top-0 h-2 bg-[#F2C94C]" />
                <span className="mx-auto flex size-14 items-center justify-center bg-[#EEE8DB] text-[#59626D]">
                  <BriefcaseBusiness size={26} aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-heading text-2xl font-bold text-[#182334]">
                  Track your first application.
                </h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#66717E]">
                  Add a role once, then let this space hold the company, stage,
                  and the context you need to return to it.
                </p>
                <Button
                  className="mt-6 h-11 rounded-none bg-[#F2C94C] px-5 font-bold text-[#182334] shadow-[0_6px_0_#C88800] hover:bg-[#FFD866]"
                  onClick={openCreate}
                >
                  <Plus aria-hidden="true" /> Add your first application
                </Button>
              </div>
                ) : filteredApplications.length === 0 ? (
                  <div className="mt-5 border border-[#CFC8BA] bg-[#FBF9F4] px-6 py-12 text-center">
                    <Search
                      aria-hidden="true"
                      className="mx-auto size-8 text-[#9E8D72]"
                    />
                    <h3 className="mt-4 font-heading text-xl font-bold text-[#182334]">
                      No applications match those filters.
                    </h3>
                    <p className="mt-2 text-sm text-[#66717E]">
                      Try a different search, stage, or source.
                    </p>
                    <Button
                      className="mt-5 h-10 rounded-none border border-[#CFC8BA] bg-transparent px-4 font-bold text-[#182334] hover:bg-[#EEE8DB]"
                      onClick={() => {
                        updateSearchQuery("");
                        updateStatusFilter("all");
                        updateSourceFilter("all");
                      }}
                      variant="outline"
                    >
                      Clear filters
                    </Button>
                  </div>
                ) : (
              <ol className="mt-5 space-y-3">
                {visibleApplications.map((application) => {
                  const theme = statusTheme[application.status];
                  const isGmailSync = application.source === "gmail-sync";
                  return (
                    <li
                      className="group relative border border-[#CFC8BA] bg-[#FBF9F4] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#9E8D72] hover:shadow-[0_16px_30px_rgba(24,35,52,0.12)]"
                      key={application.id}
                    >
                      <div className="grid grid-cols-[52px_minmax(0,1fr)] gap-x-4 gap-y-4 p-4 sm:grid-cols-[52px_minmax(0,1fr)_150px_auto] sm:items-center sm:gap-5 sm:p-5">
                        <div
                          aria-label={
                            isGmailSync
                              ? "Imported from Gmail"
                              : "Added manually"
                          }
                          className={`flex size-[52px] shrink-0 flex-col items-center justify-center gap-1 border ${
                            isGmailSync
                              ? "border-[#B9CCFF] bg-[#EAF0FF] text-[#1C50C5]"
                              : "border-[#D9D0C2] bg-[#F4F0E7] text-[#806D52]"
                          }`}
                          title={
                            isGmailSync
                              ? "Imported from Gmail"
                              : "Added manually"
                          }
                        >
                          {isGmailSync ? (
                            <Mail aria-hidden="true" size={21} strokeWidth={2.2} />
                          ) : (
                            <PenLine aria-hidden="true" size={21} strokeWidth={2.2} />
                          )}
                          <span className="sr-only">
                            {isGmailSync ? "Gmail sync" : "Manual entry"}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className={`size-2 shrink-0 rounded-full ${theme.dot}`} />
                            <h3 className="truncate font-heading text-xl font-bold tracking-[-0.025em] text-[#182334]">
                              {application.company}
                            </h3>
                          </div>
                          <div className="mt-1 flex min-w-0 items-center gap-2 text-sm text-[#66717E]">
                            <BriefcaseBusiness
                              aria-hidden="true"
                              className="size-3.5 shrink-0 text-[#9E8D72]"
                            />
                            <p className="truncate">{application.role}</p>
                          </div>
                        </div>

                        <div className="col-span-2 flex items-center gap-3 border-t border-[#E4DED3] pt-3 sm:col-span-1 sm:block sm:border-t-0 sm:pt-0">
                          <CalendarDays
                            size={16}
                            aria-hidden="true"
                            className="shrink-0 text-[#9E8D72] sm:hidden"
                          />
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#9E8D72]">
                              Applied
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[#40557F]">
                              {formatDate(application.applied_date)}
                            </p>
                          </div>
                        </div>

                        <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#E4DED3] pt-3 sm:col-span-1 sm:justify-end sm:border-t-0 sm:pt-0">
                          <select
                            aria-label={`Status for ${application.company} ${application.role}`}
                            className={`h-10 min-w-32 rounded-none border px-3 text-sm font-semibold outline-none transition-colors focus:ring-2 focus:ring-[#182334]/20 ${theme.tag}`}
                            onChange={(event) =>
                              void updateStatus(
                                application,
                                event.target.value as ApplicationStatus,
                              )
                            }
                            value={application.status}
                          >
                            {applicationStatuses.map((status) => (
                              <option key={status} value={status}>
                                {statusLabels[status]}
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-1">
                            <Button
                              aria-label={`Edit ${application.company} application`}
                              className="text-[#40557F] hover:bg-[#EAF0FF] hover:text-[#173E8C]"
                              onClick={() => openEdit(application)}
                              size="icon-sm"
                              title="Edit application"
                              variant="ghost"
                            >
                              <Pencil aria-hidden="true" />
                            </Button>
                            <Button
                              aria-label={`Delete ${application.company} application`}
                              className="text-[#9E4E4A] hover:bg-[#FFF0EE] hover:text-[#9B3029]"
                              disabled={deletingId === application.id}
                              onClick={() =>
                                setDeleteTarget(application)
                              }
                              size="icon-sm"
                              title="Delete application"
                              variant="ghost"
                            >
                              {deletingId === application.id ? (
                                <Circle
                                  className="animate-spin"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Trash2 aria-hidden="true" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
                )}
                {filteredApplications.length > 0 && (
                  <nav
                    aria-label="Applications pagination"
                    className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#CFC8BA] pt-4"
                  >
                    <p className="text-sm text-[#66717E]">
                      Showing{" "}
                      <span className="font-semibold tabular-nums text-[#182334]">
                        {(safeCurrentPage - 1) * APPLICATIONS_PER_PAGE + 1}–
                        {Math.min(
                          safeCurrentPage * APPLICATIONS_PER_PAGE,
                          filteredApplications.length,
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold tabular-nums text-[#182334]">
                        {filteredApplications.length}
                      </span>
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        aria-label="Previous page"
                        className="size-9 border-[#CFC8BA] bg-[#FBF9F4] text-[#182334] hover:bg-[#EEE8DB]"
                        disabled={safeCurrentPage === 1}
                        onClick={() => setCurrentPage((page) => page - 1)}
                        size="icon"
                        variant="outline"
                      >
                        <ChevronLeft aria-hidden="true" />
                      </Button>
                      <span className="min-w-16 text-center text-sm font-semibold tabular-nums text-[#59626D]">
                        Page {safeCurrentPage} / {pageCount}
                      </span>
                      <Button
                        aria-label="Next page"
                        className="size-9 border-[#CFC8BA] bg-[#FBF9F4] text-[#182334] hover:bg-[#EEE8DB]"
                        disabled={safeCurrentPage === pageCount}
                        onClick={() => setCurrentPage((page) => page + 1)}
                        size="icon"
                        variant="outline"
                      >
                        <ChevronRight aria-hidden="true" />
                      </Button>
                    </div>
                  </nav>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {settingsOpen && (
        <div
          className="application-editor-backdrop fixed inset-0 z-30 flex items-center justify-center bg-[#182334]/65 p-4 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSettingsOpen(false);
            }
          }}
        >
          <section
            aria-labelledby="settings-title"
            aria-modal="true"
            className="application-editor-panel w-full max-w-lg border border-[#CFC8BA] bg-[#FBF9F4] shadow-[0_28px_80px_rgba(24,35,52,0.34)]"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4 bg-[#182334] px-5 py-5 text-white sm:px-7 sm:py-6">
              <div>
                <p className="text-sm text-[#C8D0D9]">Workspace settings</p>
                <h2
                  className="mt-1 font-heading text-2xl font-bold tracking-[-0.03em]"
                  id="settings-title"
                >
                  Account and connections.
                </h2>
              </div>
              <Button
                aria-label="Close settings"
                className="text-[#DDE7FF] hover:bg-white/10 hover:text-white"
                onClick={() => setSettingsOpen(false)}
                size="icon-sm"
                variant="ghost"
              >
                <X aria-hidden="true" />
              </Button>
            </div>

            <div className="space-y-4 px-5 py-6 sm:px-7 sm:py-7">
              <div className="flex items-center gap-3 border border-[#CFC8BA] bg-[#F4F0E7] p-4">
                <span className="flex size-10 items-center justify-center bg-[#182334] text-[#F2C94C]">
                  <UserRound aria-hidden="true" size={19} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#806D52]">
                    Signed in as
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-[#182334]">
                    {session?.user.email ?? "Account email unavailable"}
                  </p>
                </div>
              </div>

              <div className="border border-[#CFC8BA] bg-[#FBF9F4] p-4">
                <div className="flex items-start gap-3">
                  <Mail
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-[#1C50C5]"
                    size={19}
                  />
                  <div>
                    <h3 className="font-semibold text-[#182334]">
                      Email connections
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[#66717E]">
                      Gmail connection and filtered email sync are planned for
                      the next implementation phase.
                    </p>
                    <span className="mt-3 inline-flex border border-[#B9CCFF] bg-[#EAF0FF] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#1C50C5]">
                      Coming in Phase 2
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t border-[#E2E7F1] pt-5">
                <Button
                  className="h-10 rounded-none border-[#CFC8BA] bg-transparent px-4 font-bold text-[#182334] hover:bg-[#EEE8DB]"
                  onClick={() => void logout()}
                  type="button"
                  variant="outline"
                >
                  <LogOut aria-hidden="true" />
                  Sign out
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}

      {deleteTarget && (
        <DeleteApplicationDialog
          company={deleteTarget.company}
          deleting={deletingId === deleteTarget.id}
          onCancel={() => {
            if (!deletingId) setDeleteTarget(null);
          }}
          onConfirm={() => {
            setDeletingId(deleteTarget.id);
            void deleteApplication(deleteTarget);
          }}
          role={deleteTarget.role}
        />
      )}

      {editorOpen && (
        <div
          className="application-editor-backdrop fixed inset-0 z-30 flex items-center justify-center bg-[#182334]/65 p-4 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setEditorOpen(false);
            }
          }}
        >
          <section
            aria-labelledby="application-editor-title"
            aria-modal="true"
            className="application-editor-panel max-h-[calc(100svh-2rem)] w-full max-w-xl overflow-y-auto border border-[#CFC8BA] bg-[#FBF9F4] shadow-[0_28px_80px_rgba(24,35,52,0.34)] sm:max-h-[calc(100svh-3rem)] sm:border-0"
            role="dialog"
          >
            <div className="bg-[#182334] px-5 py-5 text-white sm:px-7 sm:py-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-[#C8D0D9]">
                    {editing ? "Update an application" : "Add an application"}
                  </p>
                  <h2
                    className="mt-1 font-heading text-2xl font-bold tracking-[-0.03em]"
                    id="application-editor-title"
                  >
                    {editing
                      ? "Refine this application."
                      : "Keep the details in one place."}
                  </h2>
                </div>
                <Button
                  aria-label="Close"
                  className="text-[#DDE7FF] hover:bg-white/10 hover:text-white"
                  disabled={saving}
                  onClick={() => setEditorOpen(false)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <X aria-hidden="true" />
                </Button>
              </div>
            </div>

            <form
              className="space-y-5 px-5 py-6 sm:px-7 sm:py-7"
              onSubmit={saveApplication}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-[#28385E]">
                  Company
                  <input
                    autoFocus
                    className="mt-2 h-11 w-full rounded-none border border-[#CFC8BA] bg-[#F4F0E7] px-3 text-[#182334] outline-none transition-colors placeholder:text-[#89918D] focus:border-[#C88800] focus:bg-white focus:ring-2 focus:ring-[#F2C94C]/30"
                    maxLength={200}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        company: event.target.value,
                      }))
                    }
                    placeholder="Company name"
                    required
                    value={form.company}
                  />
                </label>
                <label className="block text-sm font-semibold text-[#28385E]">
                  Role
                  <input
                    className="mt-2 h-11 w-full rounded-none border border-[#CFC8BA] bg-[#F4F0E7] px-3 text-[#182334] outline-none transition-colors placeholder:text-[#89918D] focus:border-[#C88800] focus:bg-white focus:ring-2 focus:ring-[#F2C94C]/30"
                    maxLength={200}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        role: event.target.value,
                      }))
                    }
                    placeholder="Role title"
                    required
                    value={form.role}
                  />
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-[#28385E]">
                  Current stage
                  <select
                    className="mt-2 h-11 w-full rounded-none border border-[#CFC8BA] bg-[#F4F0E7] px-3 text-[#182334] outline-none transition-colors focus:border-[#C88800] focus:bg-white focus:ring-2 focus:ring-[#F2C94C]/30"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value as ApplicationStatus,
                      }))
                    }
                    value={form.status}
                  >
                    {applicationStatuses.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-[#28385E]">
                  Applied on
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-[#CDD7EA] bg-[#FAFBFE] px-3 text-[#14234A] outline-none transition-colors focus:border-[#4E82F5] focus:bg-white focus:ring-2 focus:ring-[#4E82F5]/15"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        applied_date: event.target.value || null,
                      }))
                    }
                    type="date"
                    value={form.applied_date ?? ""}
                  />
                </label>
              </div>

              {editorError && (
                <p
                  className="border border-[#DCA39B] bg-[#FFF1ED] px-3 py-2 text-sm text-[#963D31]"
                  role="alert"
                >
                  {editorError}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center gap-4 border-t border-[#E2E7F1] pt-5 sm:justify-between">
                <p className="hidden text-xs text-[#7A86A0] sm:block">
                  You can update this any time.
                </p>
                <div className="flex w-full justify-center gap-4 sm:w-auto sm:justify-end">
                  <Button
                    className="h-10 mt-0.5 px-4"
                    disabled={saving}
                    onClick={() => setEditorOpen(false)}
                    type="button"
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="h-10 rounded-none bg-[#F2C94C] px-4 font-bold text-[#182334] shadow-[0_5px_0_#C88800] hover:bg-[#FFD866]"
                    disabled={saving}
                    type="submit"
                  >
                    {saving ? (
                      <Circle className="animate-spin" aria-hidden="true" />
                    ) : (
                      <ArrowUpRight aria-hidden="true" />
                    )}
                    {editing ? "Save changes" : "Add application"}
                  </Button>
                </div>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
