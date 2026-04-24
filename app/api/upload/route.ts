import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../lib/supabase-admin";

const tableByType = {
  comic: "comics",
  animation: "animations",
  game: "games",
} as const;

function isPrimaryContentType(value: string): value is keyof typeof tableByType {
  return value in tableByType;
}

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

async function uploadPages(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  files: File[],
) {
  const uploads = await Promise.all(
    files.map(async (file, index) => ({
      page_number: index + 1,
      image_url: await uploadFile(supabase, "comic-pages", file),
    })),
  );

  return uploads.filter((page): page is { page_number: number; image_url: string } =>
    Boolean(page.image_url),
  );
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
  const contentType = String(formData.get("contentType") ?? "");
  const title = String(formData.get("title") ?? "");
  const description = String(formData.get("description") ?? "");

  if (contentType === "comicIssue") {
    const comicId = String(formData.get("comicId") ?? "");
    const issueNumber = Number(formData.get("issueNumber") ?? 0);
    const priceNaira = Number(formData.get("priceNaira") ?? 0);
    const pages = formData
      .getAll("pages")
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (!comicId || !issueNumber || pages.length === 0) {
      return NextResponse.json(
        { error: "Comic issue uploads require a comic, issue number, price, and pages" },
        { status: 400 },
      );
    }

    const comicResult = await supabase
      .from("comics")
      .select("id, slug")
      .eq("id", comicId)
      .single();

    if (comicResult.error || !comicResult.data) {
      return NextResponse.json({ error: "Parent comic not found" }, { status: 404 });
    }

    const issueInsert = await supabase
      .from("comic_issues")
      .insert({
        comic_id: comicId,
        title,
        slug: `${comicResult.data.slug}-issue-${issueNumber}`,
        summary: description,
        issue_number: issueNumber,
        price_naira: priceNaira,
        status: "published",
        created_by: user.id,
      })
      .select()
      .single();

    if (issueInsert.error || !issueInsert.data) {
      return NextResponse.json(
        { error: issueInsert.error?.message ?? "Unable to create issue" },
        { status: 400 },
      );
    }

    const pageRows = await uploadPages(supabase, pages);
    const pagesInsert = await supabase.from("comic_pages").insert(
      pageRows.map((page) => ({
        comic_id: comicId,
        comic_issue_id: issueInsert.data.id,
        page_number: page.page_number,
        image_url: page.image_url,
      })),
    );

    if (pagesInsert.error) {
      return NextResponse.json({ error: pagesInsert.error.message }, { status: 400 });
    }

    return NextResponse.json({ content: issueInsert.data });
  }

  if (!isPrimaryContentType(contentType)) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  }

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
