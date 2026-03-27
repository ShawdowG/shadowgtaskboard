import type { ReactNode } from "react";
import Link from "next/link";

// ShadowG v2 layout wrapper.
// This lets us layer v2-only UX/QA affordances without touching the root app layout.
// ENG-1100: make the /v2 surface explicitly labeled and easy to exit back to the
// primary board while keeping it visually lightweight.
export default function V2Layout({ children }: { children: ReactNode }) {
  return (
    <div
      data-testid="v2-root"
      className="flex h-screen flex-col bg-background"
      aria-label="ShadowG TaskBoard v2 shell"
    >
      <div
        role="banner"
        aria-label="ShadowG TaskBoard v2 QA surface (ENG-1100–ENG-1106)"
        aria-describedby="v2-qa-description"
        data-testid="v2-qa-banner"
        className="border-b bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2"
      >
        <span className="inline-flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wide text-purple-700">
            ShadowG TaskBoard /v2
          </span>
          <span
            className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-800 shadow-xs sm:inline-flex"
            data-testid="v2-beta-pill"
          >
            Beta
          </span>
        </span>
        <span className="hidden items-center gap-2 text-[11px] sm:inline-flex">
          <span data-testid="v2-qa-label">ENG-1100–ENG-1106 · v2 UI QA surface</span>
          <span aria-hidden="true" className="text-muted-foreground">
            ·
          </span>
          <Link
            href="/"
            className="underline-offset-2 hover:underline"
            data-testid="v2-back-to-main-link"
          >
            Back to main board
          </Link>
        </span>
        <span className="text-[10px] text-muted-foreground sm:hidden" data-testid="v2-mobile-helper">
          This is the v2 QA surface. Use &quot;Back to main board&quot; to return to the primary board.
        </span>
        <span id="v2-qa-description" className="sr-only">
          This /v2 route is a dedicated QA surface for refining ShadowG TaskBoard UX and agent workflows.
        </span>
      </div>
      <div
        className="flex-1 min-h-0 overflow-hidden"
        role="main"
        aria-label="ShadowG TaskBoard v2 board"
        data-testid="v2-board-region"
      >
        {children}
      </div>
    </div>
  );
}
