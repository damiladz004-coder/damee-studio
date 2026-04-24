import { NextRequest, NextResponse } from "next/server";
import { verifyIssuePayment } from "../../../../lib/payments";
import { getRequestUser } from "../../../../lib/server-auth";

export async function POST(request: NextRequest) {
  const auth = await getRequestUser(request);

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const body = await request.json();
  const issueId = typeof body.issueId === "string" ? body.issueId : "";
  const reference = typeof body.reference === "string" ? body.reference : "";

  if (!issueId || !reference) {
    return NextResponse.json({ error: "Issue ID and reference are required" }, { status: 400 });
  }

  const result = await verifyIssuePayment({
    issueId,
    reference,
    userId: auth.user.id,
  });

  if (result.error) {
    const status = result.error === "Issue already purchased" ? 409 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    ok: true,
    purchase: result.purchase,
    issue: result.issue,
  });
}
