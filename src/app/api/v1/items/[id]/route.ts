import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

const PATCHABLE = ["title", "status", "assignee", "sort_order", "description", "parent_id", "depth"];

// PATCH /api/v1/items/:id
// Body (all optional): { title?, status?, assignee?, sort_order?, description?, parent_id?, depth? }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const patch: Record<string, unknown> = {};
  for (const key of PATCHABLE) {
    if (key in body) patch[key] = body[key];
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "no patchable fields provided" }, { status: 400 });
  }

  const db = getSupabaseServiceClient();
  const { data, error } = await db
    .from("work_items")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .is("archived_at", null)
    .select("id,title,status,assignee,sort_order,depth,parent_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(data);
}

// DELETE /api/v1/items/:id → soft archive
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getSupabaseServiceClient();
  const { error } = await db
    .from("work_items")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
