import type { ReactNode } from "react";
import Link from "next/link";

// ShadowG v2 layout wrapper.
// This lets us layer v2-only UX/QA affordances without touching the root app layout.
// ENG-1100: make the /v2 surface explicitly labeled and easy to exit back to the
// primary board while keeping it visually lightweight.
export default function V2Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col bg-background">
      <div
        role="banner"
        aria-label="ShadowG TaskBoard v2 QA surface (ENG-1100–ENG-1106)"
        className="border-b bg-muted/40 px-4 py-1 text-xs text-muted-foreground flex items-center justify-between gap-2"
      >
        <span className="inline-flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wide text-purple-700">
            ShadowG TaskBoard /v2
          </span>
          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-800 shadow-xs sm:inline-flex">
            Beta
          </span>
        </span>
        <span className="hidden items-center gap-2 text-[11px] sm:inline-flex">
          <span>ENG-1100–ENG-1106 · v2 UI QA surface</span>
          <span aria-hidden="true" className="text-muted-foreground">
            ·
          </span>
          <Link
            href="/"
            className="underline-offset-2 hover:underline"
          >
            Back to main board
          </Link>
        </span>
        <span className="sr-only">
          This /v2 route is a dedicated QA surface for refining ShadowG TaskBoard UX and agent workflows.
        </span>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
