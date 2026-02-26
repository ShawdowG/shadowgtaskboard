import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ── Server client (per-request, reads cookies) ────────────────────────────────
// Import ONLY from Server Components, Server Actions, or Route Handlers.
// Never import this file from 'use client' components.
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {}
        },
      },
    },
  );
}

// ── Service-role client (server-only, bypasses RLS) ───────────────────────────
// Used by /api/v1/* agent routes. NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser.
export function getSupabaseServiceClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
