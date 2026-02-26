import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

// GET /api/v1/items/:id/comments
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getSupabaseServiceClient();
  const { data, error } = await db
    .from("comments")
    .select("id,body,author_id,created_at")
    .eq("work_item_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/v1/items/:id/comments
// Body: { body: string, author?: string }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  if (!body.body || typeof body.body !== "string") {
    return NextResponse.json({ error: "body string required" }, { status: 400 });
  }

  const db = getSupabaseServiceClient();
  const { data, error } = await db
    .from("comments")
    .insert({
      work_item_id: id,
      body: body.body,
    })
    .select("id,body,author_id,created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
