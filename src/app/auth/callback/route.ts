import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

// Handles the redirect from Supabase magic link emails.
// Supabase redirects to /auth/callback?code=... after the user clicks the link.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (code) {
    const db = await getSupabaseServerClient();
    await db.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL("/", req.url));
}
