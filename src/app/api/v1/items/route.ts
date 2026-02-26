import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

// POST /api/v1/items
// Body: { project_id, title, status?, assignee?, depth?, parent_id?, description? }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  if (!body.project_id || !body.title) {
    return NextResponse.json({ error: "project_id and title required" }, { status: 400 });
  }

  const status = body.status ?? "backlog";
  const db = getSupabaseServiceClient();

  // Get current max sort_order in this lane
  const { data: maxRow } = await db
    .from("work_items")
    .select("sort_order")
    .eq("project_id", body.project_id)
    .eq("status", status)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = ((maxRow?.sort_order ?? 0) as number) + 1000;

  const { data, error } = await db
    .from("work_items")
    .insert({
      project_id: body.project_id,
      title: body.title,
      status,
      assignee: body.assignee ?? null,
      depth: body.depth ?? 0,
      parent_id: body.parent_id ?? null,
      description: body.description ?? null,
      sort_order,
    })
    .select("id,title,status,assignee,depth,parent_id,sort_order")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
