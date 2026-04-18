import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../lib/supabase-admin";

const validTypes = new Set(["comic", "animation", "game"]);

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const body = await request.json();

  if (!validTypes.has(body.contentType)) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  }

  if (body.action === "like") {
    const { error } = await supabase.from("likes").upsert({
      user_id: user.id,
      content_id: body.contentId,
      content_type: body.contentType,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "comment") {
    const { error } = await supabase.from("comments").insert({
      user_id: user.id,
      content_id: body.contentId,
      content_type: body.contentType,
      body: body.body,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
