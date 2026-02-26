import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

const ALLOWED_FIELDS = new Set([
  "id", "title", "status", "assignee", "assignee_id", "depth",
  "parent_id", "sort_order", "created_at", "updated_at",
  "description", "archived_at", "project_id",
]);

const DEFAULT_FIELDS = "id,title,status,assignee,depth,parent_id,sort_order,updated_at";

// GET /api/v1/projects/:id/board?fields=id,title,status,assignee
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(req.url);
  const fieldsParam = url.searchParams.get("fields") ?? DEFAULT_FIELDS;

  const requested = fieldsParam.split(",").map((f) => f.trim()).filter((f) => ALLOWED_FIELDS.has(f));
  if (requested.length === 0) {
    return NextResponse.json({ error: "no valid fields specified" }, { status: 400 });
  }
  // Always include id and status
  const fields = [...new Set(["id", "status", ...requested])].join(",");

  const db = getSupabaseServiceClient();
  const { data, error } = await db
    .from("work_items")
    .select(fields)
    .eq("project_id", id)
    .is("archived_at", null)
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type Row = Record<string, unknown> & { status: string };
  const board: Record<string, Row[]> = { backlog: [], working: [], review: [], done: [] };
  for (const item of (data ?? []) as unknown as Row[]) {
    if (board[item.status]) board[item.status].push(item);
  }

  return NextResponse.json(board);
}
