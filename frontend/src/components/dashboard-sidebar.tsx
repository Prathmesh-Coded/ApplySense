"use client";

import {
  Circle,
  LayoutDashboard,
  LogOut,
  Mail,
  Settings,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export type SidebarStage = {
  label: string;
  count: number;
  dot: string;
};

type DashboardSidebarProps = {
  stages: SidebarStage[];
  signingOut: boolean;
  onLogout: () => void;
  onSettings: () => void;
};

export function DashboardSidebar({
  stages,
  signingOut,
  onLogout,
  onSettings,
}: DashboardSidebarProps) {
  return (
    <aside className="relative overflow-hidden bg-[#182334] px-5 py-5 text-[#F7F1E5] md:sticky md:top-0 md:h-svh md:self-start md:px-6 md:py-7">
      <div className="absolute -right-24 -top-24 size-72 rounded-full border border-[#F2C94C]/20" />
      <div className="absolute -bottom-32 -left-28 size-80 rounded-full border border-[#F2C94C]/10" />

      <div className="relative flex items-center justify-between gap-5">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-none bg-[#F2C94C] text-[#182334]">
            <LayoutDashboard size={20} aria-hidden="true" />
          </span>
          <span className="font-heading text-lg font-bold tracking-[-0.03em]">
            ApplySense
          </span>
        </div>

        <Button
          aria-label="Sign out"
          className="shrink-0 text-[#AEB7C4] hover:bg-white/10 hover:text-white"
          disabled={signingOut}
          onClick={onLogout}
          size="icon"
          title="Sign out"
          variant="ghost"
        >
          {signingOut ? (
            <Circle className="animate-spin" aria-hidden="true" />
          ) : (
            <LogOut aria-hidden="true" />
          )}
        </Button>
      </div>

      <nav aria-label="Workspace" className="relative mt-10 hidden md:block">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7F8B9B]">
          Workspace
        </p>
        <div className="mt-3 space-y-1">
          <a
            className="flex items-center gap-3 bg-[#2A394C] px-3 py-2.5 text-sm font-semibold text-white"
            href="#applications"
          >
            <LayoutDashboard
              aria-hidden="true"
              size={16}
              className="text-[#F2C94C]"
            />
            Applications
          </a>
          <button
            className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm text-[#AEB7C4] transition-colors hover:bg-white/10 hover:text-white"
            onClick={onSettings}
            type="button"
          >
            <span className="flex items-center gap-3">
              <Mail aria-hidden="true" size={16} />
              Connections
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#7F8B9B]">
              Soon
            </span>
          </button>
          <button
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-[#AEB7C4] transition-colors hover:bg-white/10 hover:text-white"
            onClick={onSettings}
            type="button"
          >
            <Settings aria-hidden="true" size={16} />
            Settings
          </button>
        </div>
      </nav>

      <section
        aria-label="Application pipeline"
        className="relative mt-8 hidden md:block"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#F2C94C]">
            Application pipeline
          </h2>
        </div>
        <ol className="relative mt-5 space-y-3 before:absolute before:bottom-4 before:left-[9px] before:top-4 before:w-px before:bg-[#455365]">
          {stages.map((stage) => (
            <li className="relative flex items-center gap-3" key={stage.label}>
              <span
                aria-hidden="true"
                className={`relative z-10 flex size-5 items-center justify-center rounded-full border-4 border-[#182334] ${stage.dot}`}
              />
              <span className="min-w-0 flex-1 text-sm text-[#DDE2E7]">
                {stage.label}
              </span>
              <span className="font-heading text-base font-bold tabular-nums text-white">
                {stage.count}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  );
}
