"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatNaira } from "../lib/format";
import { getQuestionsForGame } from "../lib/game-data";
import { supabase } from "../lib/supabase";
import type {
  ComicIssue,
  ContentItem,
  GameQuestion,
  GameScore,
  LeaderboardEntry,
} from "../lib/types";

type GameExperienceProps = {
  game: ContentItem;
  issues: ComicIssue[];
};

type ScorePayload = {
  leaderboard: LeaderboardEntry[];
  userScore: GameScore | null;
  rewardByRank: Record<string, number>;
};

const GAME_SLUG = "issue-quiz";

export default function GameExperience({ game, issues }: GameExperienceProps) {
  const [selectedIssueId, setSelectedIssueId] = useState(issues[0]?.id ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userScore, setUserScore] = useState<GameScore | null>(null);
  const [rewardByRank, setRewardByRank] = useState<Record<string, number>>({});

  const selectedIssue = issues.find((issue) => issue.id === selectedIssueId) ?? issues[0] ?? null;
  const questions = useMemo<GameQuestion[]>(
    () => getQuestionsForGame(selectedIssue?.slug, GAME_SLUG),
    [selectedIssue?.slug],
  );

  useEffect(() => {
    setAnswers({});
  }, [selectedIssueId]);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedIssueId]);

  async function authToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token ?? null;
  }

  async function loadLeaderboard() {
    if (!selectedIssue) return;

    const token = await authToken();
    const response = await fetch(
      `/api/game-scores?issueId=${selectedIssue.id}&gameSlug=${GAME_SLUG}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );

    if (!response.ok) return;

    const payload = (await response.json()) as ScorePayload;
    setLeaderboard(payload.leaderboard ?? []);
    setUserScore(payload.userScore ?? null);
    setRewardByRank(payload.rewardByRank ?? {});
  }

  async function submitScore() {
    if (!selectedIssue) return;

    const token = await authToken();

    if (!token) {
      setStatus("Sign in to submit your score.");
      return;
    }

    const score = questions.reduce(
      (total, question) => total + (answers[question.id] === question.answer ? 1 : 0),
      0,
    );

    const response = await fetch("/api/game-scores", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        comicIssueId: selectedIssue.id,
        gameSlug: GAME_SLUG,
        score,
      }),
    });

    const payload = (await response.json()) as ScorePayload & { error?: string };

    if (!response.ok) {
      setStatus(payload.error ?? "Unable to submit score.");
      return;
    }

    setLeaderboard(payload.leaderboard ?? []);
    setUserScore(payload.userScore ?? null);
    setRewardByRank(payload.rewardByRank ?? {});
    setStatus(`Score submitted: ${score}/${questions.length}.`);
  }

  return (
    <main className="section-shell">
      <div className="section-heading">
        <p className="eyebrow">Issue game</p>
        <h1>{game.title}</h1>
        <p>
          Play a quick comic-linked quiz, chase the leaderboard, and track the
          reward pool for top readers.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="panel p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                Select issue
              </label>
              <select
                className="field mt-2"
                value={selectedIssueId}
                onChange={(event) => setSelectedIssueId(event.target.value)}
              >
                {issues.map((issue) => (
                  <option key={issue.id} value={issue.id}>
                    Issue {issue.issue_number}: {issue.title}
                  </option>
                ))}
              </select>
            </div>
            {selectedIssue ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-zinc-500">Prize spotlight</p>
                <p className="mt-2 text-xl font-black uppercase text-white">
                  1st place {formatNaira(Number(rewardByRank["1"] ?? 2000))}
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-6 space-y-5">
            {questions.map((question, index) => (
              <div key={question.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                  Question {index + 1}
                </p>
                <p className="mt-2 text-lg font-bold text-white">{question.prompt}</p>
                <div className="mt-4 grid gap-3">
                  {question.options.map((option) => {
                    const selected = answers[question.id] === option;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          setAnswers((current) => ({ ...current, [question.id]: option }))
                        }
                        className={`rounded-2xl border px-4 py-3 text-left transition ${
                          selected
                            ? "border-[var(--accent-strong)] bg-[rgba(71,181,255,0.08)] text-white"
                            : "border-white/10 bg-zinc-950 text-zinc-300"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 md:flex-row">
            <button type="button" className="btn btn-primary md:w-56" onClick={submitScore}>
              Submit score
            </button>
            <Link href="/dashboard" className="btn btn-secondary md:w-56">
              View wallet
            </Link>
          </div>
          {status ? <p className="mt-4 text-sm text-zinc-400">{status}</p> : null}
        </section>

        <aside className="space-y-6">
          <div className="panel p-5">
            <h2 className="text-2xl font-black uppercase">Your best score</h2>
            <p className="mt-3 text-4xl font-black uppercase text-white">
              {userScore ? `${userScore.score}/${questions.length}` : "Not set"}
            </p>
            <p className="mt-3 text-sm text-zinc-400">
              Rewards are shown as leaderboard targets. They can be reviewed and
              settled from the admin side as the reward system matures.
            </p>
          </div>

          <div className="panel p-5">
            <h2 className="text-2xl font-black uppercase">Leaderboard</h2>
            <div className="mt-5 space-y-3">
              {leaderboard.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
                      Rank {entry.rank}
                    </p>
                    <p className="mt-1 font-bold text-white">Score {entry.score}</p>
                  </div>
                  <p className="text-sm font-bold text-[var(--accent-strong)]">
                    {formatNaira(entry.reward_amount_naira)}
                  </p>
                </div>
              ))}
              {!leaderboard.length ? (
                <p className="text-sm text-zinc-500">No scores yet. Set the first benchmark.</p>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
