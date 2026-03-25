import type { ReactNode } from "react";

// ShadowG v2 layout wrapper.
// This lets us layer v2-only UX/QA affordances without touching the root app layout.
export default function V2Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="border-b bg-muted/40 px-4 py-1 text-xs text-muted-foreground flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wide text-purple-700">
          ShadowG TaskBoard /v2
        </span>
        <span className="hidden sm:inline">ENG-1100–ENG-1106 · v2 UI QA surface</span>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
