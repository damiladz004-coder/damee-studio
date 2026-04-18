import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../lib/supabase-admin";

const tableByType = {
  comic: "comics",
  animation: "animations",
  game: "games",
} as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uploadFile(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  bucket: string,
  file: File | null,
) {
  if (!file || file.size === 0) return null;

  const extension = file.name.split(".").pop() ?? "bin";
  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  if (!user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });
  }

  const formData = await request.formData();
  const contentType = String(formData.get("contentType")) as keyof typeof tableByType;

  if (!tableByType[contentType]) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  }

  const title = String(formData.get("title") ?? "");
  const description = String(formData.get("description") ?? "");
  const thumbnail = formData.get("thumbnail") as File | null;
  const media = formData.get("media") as File | null;

  const thumbnailUrl = await uploadFile(supabase, "thumbnails", thumbnail);
  const mediaUrl = await uploadFile(
    supabase,
    contentType === "animation" ? "videos" : "comics",
    media,
  );

  const { data, error } = await supabase
    .from(tableByType[contentType])
    .insert({
      title,
      slug: slugify(title),
      description,
      thumbnail_url: thumbnailUrl,
      media_url: mediaUrl,
      status: "published",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ content: data });
}
