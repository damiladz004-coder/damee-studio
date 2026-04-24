import { NextRequest, NextResponse } from "next/server";
import { formatNaira } from "../../../lib/format";
import { purchaseIssueForUser } from "../../../lib/purchases";
import { getRequestUser } from "../../../lib/server-auth";

export async function POST(request: NextRequest) {
  const auth = await getRequestUser(request);

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const body = await request.json();
  const issueId = typeof body.issueId === "string" ? body.issueId : "";
  const paymentReference =
    typeof body.paymentReference === "string" ? body.paymentReference : null;

  if (!issueId) {
    return NextResponse.json({ error: "Issue ID is required" }, { status: 400 });
  }

  const result = await purchaseIssueForUser({
    issueId,
    paymentReference,
    user: auth.user,
  });

  if (result.error) {
    const status = result.error === "Issue already purchased" ? 409 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  if (!result.issue || !result.purchase) {
    return NextResponse.json({ error: "Unable to complete purchase" }, { status: 500 });
  }

  const issue = result.issue;
  const purchase = result.purchase;

  return NextResponse.json({
    ok: true,
    purchase,
    issue,
    message: `Unlocked ${issue.title} for ${formatNaira(issue.price_naira)}.`,
  });
}
