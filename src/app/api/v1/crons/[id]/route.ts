import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

// PATCH /api/v1/crons/:id
// Body: { name?, schedule?, assignee?, description?, enabled?, last_run_at? }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const allowed = ["name", "schedule", "assignee", "description", "enabled", "last_run_at"];
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }
  const db = getSupabaseServiceClient();
  const { data, error } = await db
    .from("cron_jobs")
    .update(update)
    .eq("id", params.id)
    .select("id,name,schedule,assignee,description,enabled,last_run_at,created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/v1/crons/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getSupabaseServiceClient();
  const { error } = await db.from("cron_jobs").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
