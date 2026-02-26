import { createBrowserClient } from "@supabase/ssr";

// ── Browser client (singleton) ────────────────────────────────────────────────
// Safe to import in 'use client' components. No server-only APIs used here.
let _browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!_browserClient) {
    _browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return _browserClient;
}
