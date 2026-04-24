import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../lib/supabase-admin";
import { getRequestUser } from "../../../lib/server-auth";

const REWARD_BY_RANK: Record<number, number> = {
  1: 2000,
  2: 1000,
  3: 500,
};

async function rebuildLeaderboard(comicIssueId: string, gameSlug: string) {
  const supabase = createSupabaseAdmin();
  const scoresResult = await supabase
    .from("game_scores")
    .select("id, user_id, comic_issue_id, game_slug, score, created_at")
    .eq("comic_issue_id", comicIssueId)
    .eq("game_slug", gameSlug)
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(10);

  const scores = scoresResult.data ?? [];

  await supabase
    .from("leaderboards")
    .delete()
    .eq("comic_issue_id", comicIssueId)
    .eq("game_slug", gameSlug);

  if (!scores.length) return [];

  const leaderboardRows = scores.map((score, index) => ({
    comic_issue_id: comicIssueId,
    game_slug: gameSlug,
    user_id: score.user_id,
    rank: index + 1,
    score: score.score,
    reward_amount_naira: REWARD_BY_RANK[index + 1] ?? 0,
  }));

  const insertResult = await supabase
    .from("leaderboards")
    .insert(leaderboardRows)
    .select("id, comic_issue_id, game_slug, user_id, rank, score, reward_amount_naira, created_at");

  return insertResult.data ?? [];
}

export async function GET(request: NextRequest) {
  const issueId = request.nextUrl.searchParams.get("issueId") ?? "";
  const gameSlug = request.nextUrl.searchParams.get("gameSlug") ?? "issue-quiz";

  if (!issueId) {
    return NextResponse.json({ error: "Issue ID is required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const leaderboard = await rebuildLeaderboard(issueId, gameSlug);

  const { data: userResult } = await supabase.auth.getUser(
    request.headers.get("authorization")?.replace("Bearer ", "") ?? "",
  );

  const userScoreResult = userResult.user
    ? await supabase
        .from("game_scores")
        .select("id, user_id, comic_issue_id, game_slug, score, created_at")
        .eq("comic_issue_id", issueId)
        .eq("game_slug", gameSlug)
        .eq("user_id", userResult.user.id)
        .maybeSingle()
    : { data: null };

  return NextResponse.json({
    leaderboard,
    userScore: userScoreResult.data,
    rewardByRank: REWARD_BY_RANK,
  });
}

export async function POST(request: NextRequest) {
  const auth = await getRequestUser(request);

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const body = await request.json();
  const comicIssueId = typeof body.comicIssueId === "string" ? body.comicIssueId : "";
  const gameSlug = typeof body.gameSlug === "string" ? body.gameSlug : "issue-quiz";
  const score = Number(body.score);

  if (!comicIssueId || !Number.isFinite(score) || score < 0) {
    return NextResponse.json({ error: "Issue ID and score are required" }, { status: 400 });
  }

  const existingResult = await auth.supabase
    .from("game_scores")
    .select("id, score")
    .eq("user_id", auth.user.id)
    .eq("comic_issue_id", comicIssueId)
    .eq("game_slug", gameSlug)
    .maybeSingle();

  if (existingResult.data) {
    const nextScore = Math.max(existingResult.data.score, score);
    await auth.supabase
      .from("game_scores")
      .update({ score: nextScore })
      .eq("id", existingResult.data.id);
  } else {
    await auth.supabase.from("game_scores").insert({
      user_id: auth.user.id,
      comic_issue_id: comicIssueId,
      game_slug: gameSlug,
      score,
    });
  }

  const leaderboard = await rebuildLeaderboard(comicIssueId, gameSlug);

  const userScoreResult = await auth.supabase
    .from("game_scores")
    .select("id, user_id, comic_issue_id, game_slug, score, created_at")
    .eq("comic_issue_id", comicIssueId)
    .eq("game_slug", gameSlug)
    .eq("user_id", auth.user.id)
    .single();

  return NextResponse.json({
    ok: true,
    leaderboard,
    userScore: userScoreResult.data,
    rewardByRank: REWARD_BY_RANK,
  });
}
