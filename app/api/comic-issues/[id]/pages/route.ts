import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../../../lib/supabase-admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = createSupabaseAdmin();
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  const issueResult = await supabase
    .from("comic_issues")
    .select("id, price_naira")
    .eq("id", id)
    .neq("status", "draft")
    .single();

  if (issueResult.error || !issueResult.data) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  let hasAccess = issueResult.data.price_naira === 0;

  if (!hasAccess && token) {
    const userResult = await supabase.auth.getUser(token);

    if (userResult.data.user) {
      const purchaseResult = await supabase
        .from("purchases")
        .select("id")
        .eq("user_id", userResult.data.user.id)
        .eq("comic_issue_id", id)
        .maybeSingle();

      hasAccess = Boolean(purchaseResult.data);
    }
  }

  if (!hasAccess) {
    return NextResponse.json({ error: "Purchase required" }, { status: 403 });
  }

  const pagesResult = await supabase
    .from("comic_pages")
    .select("id, comic_id, comic_issue_id, page_number, image_url")
    .eq("comic_issue_id", id)
    .order("page_number", { ascending: true });

  return NextResponse.json({ pages: pagesResult.data ?? [] });
}
