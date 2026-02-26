import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

// GET /api/v1/health
// Use this to verify DB connectivity and that migrations have been applied.
export async function GET() {
  const db = getSupabaseServiceClient();
  const checks: Record<string, string> = {};

  // Check each required table exists
  for (const table of ["projects", "work_items", "comments", "activity_logs"] as const) {
    const { error } = await db.from(table).select("id").limit(1);
    checks[table] = error ? `ERROR: ${error.message}` : "ok";
  }

  // Check migration 002 column exists
  const { error: colError } = await db
    .from("work_items")
    .select("assignee")
    .limit(1);
  checks["migration_002_assignee_col"] = colError ? `ERROR: ${colError.message}` : "ok";

  const allOk = Object.values(checks).every((v) => v === "ok");

  return NextResponse.json(
    { status: allOk ? "ok" : "degraded", checks },
    { status: allOk ? 200 : 500 },
  );
}
