import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../../../lib/supabase-admin";
import { getAdminRequestUser } from "../../../../../lib/server-auth";

export async function POST(request: NextRequest) {
  const auth = await getAdminRequestUser(request);

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const body = await request.json();
  const comicIssueId = typeof body.comicIssueId === "string" ? body.comicIssueId : "";
  const gameSlug = typeof body.gameSlug === "string" ? body.gameSlug : "issue-quiz";

  if (!comicIssueId) {
    return NextResponse.json({ error: "Issue ID is required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const leaderboardResult = await supabase
    .from("leaderboards")
    .select("id, user_id, reward_amount_naira, rank, reward_settled_at")
    .eq("comic_issue_id", comicIssueId)
    .eq("game_slug", gameSlug)
    .is("reward_settled_at", null)
    .gt("reward_amount_naira", 0)
    .order("rank", { ascending: true });

  const leaderboardRows = leaderboardResult.data ?? [];

  if (!leaderboardRows.length) {
    return NextResponse.json({ ok: true, settledCount: 0 });
  }

  let settledCount = 0;

  for (const row of leaderboardRows) {
    const walletResult = await supabase
      .from("wallets")
      .select("id, available_balance, lifetime_earnings")
      .eq("user_id", row.user_id)
      .single();

    if (!walletResult.data) continue;

    const wallet = walletResult.data;
    const updateWallet = await supabase
      .from("wallets")
      .update({
        available_balance: wallet.available_balance + row.reward_amount_naira,
        lifetime_earnings: wallet.lifetime_earnings + row.reward_amount_naira,
      })
      .eq("id", wallet.id);

    if (updateWallet.error) continue;

    const transactionResult = await supabase
      .from("transactions")
      .insert({
        user_id: row.user_id,
        wallet_id: wallet.id,
        transaction_type: "reward",
        transaction_status: "completed",
        amount_naira: row.reward_amount_naira,
        description: `Leaderboard reward for rank ${row.rank}`,
        metadata: {
          comic_issue_id: comicIssueId,
          game_slug: gameSlug,
          rank: row.rank,
        },
      })
      .select("id")
      .single();

    if (!transactionResult.data) continue;

    await supabase
      .from("leaderboards")
      .update({
        reward_settled_at: new Date().toISOString(),
        reward_transaction_id: transactionResult.data.id,
      })
      .eq("id", row.id);

    settledCount += 1;
  }

  return NextResponse.json({ ok: true, settledCount });
}
