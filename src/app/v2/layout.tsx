import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

// ShadowG v2 layout wrapper.
// This lets us layer v2-only UX/QA affordances without touching the root app layout.
// ENG-1100: make the /v2 surface explicitly labeled and easy to exit back to the
// primary board while keeping it visually lightweight.
// ENG-1101/ENG-1102: expose stable QA and a11y hooks for the v2 shell, banner,
// helper copy, and main board region via data-testid + ARIA attributes.

export const metadata: Metadata = {
  title: "ShadowG TaskBoard v2",
  description:
    "ShadowG TaskBoard /v2 – dedicated QA surface for ENG-1100–ENG-1106.",
};

export default function V2Layout({ children }: { children: ReactNode }) {
  return (
    <div
      data-testid="v2-root"
      data-qa="v2-shell-root"
      className="flex h-screen flex-col bg-background"
      aria-label="ShadowG TaskBoard v2 shell"
    >
      <a
        href="#v2-board-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-background focus:px-3 focus:py-1 focus:text-xs focus:shadow"
        data-testid="v2-skip-to-board-link"
        aria-label="Skip to ShadowG TaskBoard v2 board"
      >
        Skip to v2 board
      </a>
      <div
        role="banner"
        aria-label="ShadowG TaskBoard v2 QA surface (ENG-1100–ENG-1106)"
        aria-describedby="v2-qa-description"
        data-testid="v2-qa-banner"
        className="border-b bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2"
      >
        <span className="inline-flex items-center gap-2">
          <span
            className="font-mono text-[11px] uppercase tracking-wide text-purple-700"
            data-testid="v2-banner-title"
          >
            ShadowG TaskBoard /v2
          </span>
          <span
            className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-800 shadow-xs sm:inline-flex"
            data-testid="v2-beta-pill"
            aria-label="ShadowG TaskBoard v2 beta surface"
          >
            Beta
          </span>
        </span>
        <span
          className="hidden items-center gap-2 text-[11px] sm:inline-flex"
          data-testid="v2-qa-controls-desktop"
        >
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
        <span
          className="text-[10px] text-muted-foreground sm:hidden"
          data-testid="v2-mobile-helper"
          data-qa="v2-qa-controls-mobile"
        >
          You are viewing the ShadowG TaskBoard /v2 QA surface. Use{" "}
          <Link
            href="/"
            className="underline-offset-2 hover:underline"
            data-testid="v2-back-to-main-link-mobile"
          >
            Back to main board
          </Link>{" "}
          to return to the primary board.
        </span>
        <span
          id="v2-qa-description"
          className="sr-only"
          data-testid="v2-qa-description"
        >
          This /v2 route is a dedicated QA surface for refining ShadowG TaskBoard UX and
          agent workflows. Use Back to main board at the top of the page when you want
          to return to the primary board.
        </span>
      </div>
      <div
        id="v2-board-main"
        className="flex-1 min-h-0 overflow-hidden"
        role="main"
        aria-labelledby="v2-board-heading"
        aria-describedby="v2-qa-description"
        tabIndex={-1}
        data-testid="v2-board-region"
        data-qa="v2-board-region"
      >
        <h1
          id="v2-board-heading"
          className="sr-only"
          data-testid="v2-board-heading"
        >
          ShadowG TaskBoard v2 board
        </h1>
        {children}
      </div>
    </div>
  );
}
