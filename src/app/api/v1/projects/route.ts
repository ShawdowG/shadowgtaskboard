import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-server";

// GET /api/v1/projects
export async function GET() {
  const db = getSupabaseServiceClient();
  const { data, error } = await db
    .from("projects")
    .select("id,name,slug,created_at")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/v1/projects
// Body: { name: string, slug?: string }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!body.name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const slug =
    body.slug ?? body.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const db = getSupabaseServiceClient();
  const { data, error } = await db
    .from("projects")
    .insert({ name: body.name, slug })
    .select("id,name,slug")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
