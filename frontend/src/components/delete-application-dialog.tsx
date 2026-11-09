"use client";

import { AlertTriangle, Circle, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type DeleteApplicationDialogProps = {
  company: string;
  role: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteApplicationDialog({
  company,
  role,
  deleting,
  onCancel,
  onConfirm,
}: DeleteApplicationDialogProps) {
  return (
    <div
      className="application-editor-backdrop fixed inset-0 z-40 flex items-center justify-center bg-[#182334]/65 p-4 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !deleting) onCancel();
      }}
    >
      <section
        aria-labelledby="delete-application-title"
        aria-modal="true"
        className="w-full max-w-md border border-[#DCA39B] bg-[#FBF9F4] shadow-[0_28px_80px_rgba(24,35,52,0.34)]"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E8C8C2] bg-[#FFF1ED] px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center bg-[#963D31] text-white">
              <AlertTriangle aria-hidden="true" size={19} />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#963D31]">
                Delete application
              </p>
              <h2
                className="mt-0.5 font-heading text-xl font-bold tracking-[-0.025em] text-[#182334]"
                id="delete-application-title"
              >
                Remove this record?
              </h2>
            </div>
          </div>
          <Button
            aria-label="Close delete dialog"
            className="text-[#963D31] hover:bg-[#FBE0DB]"
            disabled={deleting}
            onClick={onCancel}
            size="icon-sm"
            variant="ghost"
          >
            <X aria-hidden="true" />
          </Button>
        </div>

        <div className="px-5 py-6 sm:px-6">
          <p className="text-sm leading-6 text-[#59626D]">
            This will permanently remove the application and its tracked
            details. This action cannot be undone.
          </p>
          <div className="mt-4 border border-[#CFC8BA] bg-[#F4F0E7] px-4 py-3">
            <p className="font-semibold text-[#182334]">{company}</p>
            <p className="mt-1 text-sm text-[#66717E]">{role}</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-[#E2E7F1] px-5 py-4 sm:px-6">
          <Button
            className="h-10 border-[#CFC8BA] bg-transparent mt-0.5 px-4 font-bold text-[#182334] hover:bg-[#EEE8DB]"
            disabled={deleting}
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            Keep application
          </Button>
          <Button
            className="h-10 rounded-none bg-[#963D31] px-4 font-bold text-white shadow-[0_4px_0_#6E2923] hover:bg-[#A9473B]"
            disabled={deleting}
            onClick={onConfirm}
            type="button"
          >
            {deleting ? (
              <Circle className="animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 aria-hidden="true" />
            )}
            Delete permanently
          </Button>
        </div>
      </section>
    </div>
  );
}
