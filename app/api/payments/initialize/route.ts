import { NextRequest, NextResponse } from "next/server";
import { initiateIssueCheckout } from "../../../../lib/payments";
import { getRequestUser } from "../../../../lib/server-auth";

export async function POST(request: NextRequest) {
  const auth = await getRequestUser(request);

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const body = await request.json();
  const issueId = typeof body.issueId === "string" ? body.issueId : "";
  const redirectPath = typeof body.redirectPath === "string" ? body.redirectPath : "/comics";

  if (!issueId) {
    return NextResponse.json({ error: "Issue ID is required" }, { status: 400 });
  }

  const issueResult = await auth.supabase
    .from("comic_issues")
    .select("id, title, price_naira")
    .eq("id", issueId)
    .neq("status", "draft")
    .single();

  if (issueResult.error || !issueResult.data) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  const profileResult = await auth.supabase
    .from("profiles")
    .select("username")
    .eq("id", auth.user.id)
    .single();

  const email = auth.user.email || `${profileResult.data?.username ?? auth.user.id}@damee.local`;
  const checkout = await initiateIssueCheckout({
    userId: auth.user.id,
    email,
    issueId,
    title: issueResult.data.title,
    amountNaira: issueResult.data.price_naira,
    redirectPath,
  });

  if (checkout.error) {
    return NextResponse.json({ error: checkout.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    provider: checkout.provider,
    authorizationUrl: checkout.authorizationUrl,
    reference: checkout.reference,
  });
}
