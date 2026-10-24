import { LoaderCircle } from "lucide-react";

type LoadingScreenProps = {
  label?: string;
};

export function LoadingScreen({ label = "Loading" }: LoadingScreenProps) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#f5f7f4] px-5 text-[#19372b]">
      <section
        aria-label={label}
        aria-live="polite"
        className="flex flex-col items-center"
        role="status"
      >
        <span className="mb-7 font-heading text-lg font-semibold">ApplySense</span>
        <LoaderCircle
          aria-hidden="true"
          className="size-8 animate-spin text-[#438365] motion-reduce:animate-none"
          strokeWidth={1.8}
        />
        <p className="mt-4 text-sm text-[#64736b]">{label}</p>
      </section>
    </main>
  );
}
