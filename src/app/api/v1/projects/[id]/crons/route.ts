import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

// GET /api/v1/projects/:id/crons
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getSupabaseServiceClient();
  const { data, error } = await db
    .from("cron_jobs")
    .select("id,name,schedule,assignee,description,enabled,last_run_at,created_at")
    .eq("project_id", id)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/v1/projects/:id/crons
// Body: { name, schedule, assignee?, description? }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (!body.name || !body.schedule) {
    return NextResponse.json({ error: "name and schedule required" }, { status: 400 });
  }
  const db = getSupabaseServiceClient();
  const { data, error } = await db
    .from("cron_jobs")
    .insert({
      project_id: id,
      name: body.name,
      schedule: body.schedule,
      assignee: body.assignee ?? null,
      description: body.description ?? null,
      enabled: body.enabled ?? true,
    })
    .select("id,name,schedule,assignee,description,enabled,last_run_at,created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
