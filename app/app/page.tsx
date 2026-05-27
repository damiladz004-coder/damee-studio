"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { formatNaira } from "../../lib/format";

type DashboardStats = {
  totalUsers: number;
  totalComics: number;
  totalAnimations: number;
  totalGames: number;
  totalRevenue: number;
  pendingRewards: number;
  loading: boolean;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalComics: 0,
    totalAnimations: 0,
    totalGames: 0,
    totalRevenue: 0,
    pendingRewards: 0,
    loading: true,
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      // Get user count
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact" });

      // Get published comics count
      const { count: comicCount } = await supabase
        .from("comics")
        .select("*", { count: "exact" })
        .eq("status", "published");

      // Get published animations count
      const { count: animationCount } = await supabase
        .from("animations")
        .select("*", { count: "exact" })
        .eq("status", "published");

      // Get published games count
      const { count: gameCount } = await supabase
        .from("games")
        .select("*", { count: "exact" })
        .eq("status", "published");

      // Get total revenue from purchases
      const { data: revenueData } = await supabase
        .from("purchases")
        .select("amount_naira");

      const totalRevenue = (revenueData ?? []).reduce((sum, p) => sum + (p.amount_naira || 0), 0);

      // Get pending rewards count
      const { count: rewardCount } = await supabase
        .from("leaderboards")
        .select("*", { count: "exact" })
        .is("reward_settled_at", null)
        .gt("reward_amount_naira", 0);

      setStats({
        totalUsers: userCount || 0,
        totalComics: comicCount || 0,
        totalAnimations: animationCount || 0,
        totalGames: gameCount || 0,
        totalRevenue,
        pendingRewards: rewardCount || 0,
        loading: false,
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-zinc-400">Welcome to the Damee Studio admin panel</p>
      </div>

      {stats.loading ? (
        <div className="text-zinc-400">Loading stats...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Users Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm mb-1">Total Users</p>
                <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          {/* Comics Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm mb-1">Published Comics</p>
                <p className="text-3xl font-bold text-white">{stats.totalComics}</p>
              </div>
              <div className="text-4xl">📚</div>
            </div>
          </div>

          {/* Animations Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm mb-1">Published Animations</p>
                <p className="text-3xl font-bold text-white">{stats.totalAnimations}</p>
              </div>
              <div className="text-4xl">🎬</div>
            </div>
          </div>

          {/* Games Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm mb-1">Published Games</p>
                <p className="text-3xl font-bold text-white">{stats.totalGames}</p>
              </div>
              <div className="text-4xl">🎮</div>
            </div>
          </div>

          {/* Revenue Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-white">{formatNaira(stats.totalRevenue)}</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          {/* Pending Rewards Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm mb-1">Pending Rewards</p>
                <p className="text-3xl font-bold text-white">{stats.pendingRewards}</p>
              </div>
              <div className="text-4xl">🏆</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href="/app/comics"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors text-center"
          >
            Manage Comics
          </a>
          <a
            href="/app/animations"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors text-center"
          >
            Manage Animations
          </a>
          <a
            href="/app/games"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors text-center"
          >
            Manage Games
          </a>
          <a
            href="/app/rewards"
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg transition-colors text-center"
          >
            Settle Rewards
          </a>
          <a
            href="/app/users"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors text-center"
          >
            View Users
          </a>
          <a
            href="/app/analytics"
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg transition-colors text-center"
          >
            View Analytics
          </a>
        </div>
      </div>
    </div>
  );
}
