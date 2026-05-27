"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { formatNaira } from "../../../lib/format";

type Leaderboard = {
  id: string;
  user_id: string;
  comic_issue_id: string;
  game_slug: string;
  rank: number;
  score: number;
  reward_amount_naira: number;
  reward_settled_at: string | null;
  user_display_name: string;
  comic_title: string;
  issue_number: number;
};

export default function RewardsPage() {
  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending">("pending");

  useEffect(() => {
    loadLeaderboards();
  }, [filter]);

  async function loadLeaderboards() {
    try {
      let query = supabase
        .from("leaderboards")
        .select(
          `
          id,
          user_id,
          comic_issue_id,
          game_slug,
          rank,
          score,
          reward_amount_naira,
          reward_settled_at,
          profiles (display_name),
          comic_issues (issue_number, comics (title))
        `
        )
        .order("reward_settled_at", { ascending: true })
        .order("rank", { ascending: true });

      if (filter === "pending") {
        query = query.is("reward_settled_at", null);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formatted = (data ?? []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        comic_issue_id: row.comic_issue_id,
        game_slug: row.game_slug,
        rank: row.rank,
        score: row.score,
        reward_amount_naira: row.reward_amount_naira,
        reward_settled_at: row.reward_settled_at,
        user_display_name: row.profiles?.display_name || "Unknown",
        comic_title: row.comic_issues?.comics?.title || "Unknown",
        issue_number: row.comic_issues?.issue_number || 0,
      }));

      setLeaderboards(formatted);
    } catch (error) {
      console.error("Failed to load leaderboards:", error);
    } finally {
      setLoading(false);
    }
  }

  async function settleRewards() {
    if (!confirm("Settle all pending rewards? This action cannot be undone.")) {
      return;
    }

    setSettling(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/admin/rewards/settle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to settle rewards");
      }

      const result = await response.json();
      alert(`Successfully settled ${result.settledCount} rewards!`);
      await loadLeaderboards();
    } catch (error) {
      console.error("Failed to settle rewards:", error);
      alert("Failed to settle rewards: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setSettling(false);
    }
  }

  const pendingCount = leaderboards.filter((l) => !l.reward_settled_at).length;
  const totalPendingRewards = leaderboards
    .filter((l) => !l.reward_settled_at)
    .reduce((sum, l) => sum + l.reward_amount_naira, 0);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Reward Management</h1>
          <p className="text-zinc-400">Manage leaderboard rewards and payouts</p>
        </div>
        {pendingCount > 0 && (
          <button
            onClick={settleRewards}
            disabled={settling}
            className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-600/50 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {settling ? "Settling..." : `Settle ${pendingCount} Rewards`}
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <p className="text-zinc-400 text-sm mb-1">Pending Rewards</p>
          <p className="text-3xl font-bold text-white">{pendingCount}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <p className="text-zinc-400 text-sm mb-1">Total Pending Payout</p>
          <p className="text-2xl font-bold text-white">{formatNaira(totalPendingRewards)}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <p className="text-zinc-400 text-sm mb-1">Settled Rewards</p>
          <p className="text-3xl font-bold text-white">
            {leaderboards.filter((l) => l.reward_settled_at).length}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          All Rewards
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === "pending"
              ? "bg-blue-600 text-white"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          Pending Only
        </button>
      </div>

      {/* Leaderboards Table */}
      {loading ? (
        <div className="text-zinc-400">Loading leaderboards...</div>
      ) : leaderboards.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
          <p className="text-zinc-400">
            {filter === "pending" ? "No pending rewards" : "No rewards yet"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-zinc-900 border border-zinc-800 rounded-lg">
          <table className="w-full">
            <thead className="border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Comic</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Rank</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Score</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Reward</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
              </tr>
            </thead>
            <tbody>
              {leaderboards.map((row) => (
                <tr key={row.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                  <td className="px-6 py-4 text-white">{row.user_display_name}</td>
                  <td className="px-6 py-4 text-white">
                    {row.comic_title} #{row.issue_number}
                  </td>
                  <td className="px-6 py-4 text-white font-bold text-lg">#{row.rank}</td>
                  <td className="px-6 py-4 text-zinc-400">{row.score.toLocaleString()}</td>
                  <td className="px-6 py-4 text-white font-semibold">
                    {formatNaira(row.reward_amount_naira)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        row.reward_settled_at
                          ? "bg-green-500/20 text-green-300"
                          : "bg-yellow-500/20 text-yellow-300"
                      }`}
                    >
                      {row.reward_settled_at ? "Settled" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
