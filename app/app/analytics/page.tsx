"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { formatNaira } from "../../../lib/format";

type Analytics = {
  totalUsers: number;
  totalPurchases: number;
  totalRevenue: number;
  averagePurchaseValue: number;
  totalComics: number;
  totalAnimations: number;
  totalGames: number;
  topComics: Array<{
    id: string;
    title: string;
    purchase_count: number;
  }>;
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      // User count
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact" });

      // Purchase data
      const { data: purchases } = await supabase.from("purchases").select("amount_naira");
      const totalRevenue = (purchases ?? []).reduce((sum, p) => sum + (p.amount_naira || 0), 0);
      const averageValue = purchases && purchases.length > 0 ? totalRevenue / purchases.length : 0;

      // Content counts
      const { count: comicCount } = await supabase
        .from("comics")
        .select("*", { count: "exact" });

      const { count: animationCount } = await supabase
        .from("animations")
        .select("*", { count: "exact" });

      const { count: gameCount } = await supabase
        .from("games")
        .select("*", { count: "exact" });

      // Top comics by purchases
      const { data: topComicsData } = await supabase
        .from("comic_issues")
        .select("id, title, purchases(count)")
        .limit(5)
        .order("created_at", { ascending: false });

      const topComics = (topComicsData ?? [])
        .map((comic: any) => ({
          id: comic.id,
          title: comic.title,
          purchase_count: comic.purchases?.length || 0,
        }))
        .sort((a, b) => b.purchase_count - a.purchase_count);

      setAnalytics({
        totalUsers: userCount || 0,
        totalPurchases: purchases?.length || 0,
        totalRevenue,
        averagePurchaseValue: averageValue,
        totalComics: comicCount || 0,
        totalAnimations: animationCount || 0,
        totalGames: gameCount || 0,
        topComics: topComics.slice(0, 5),
      });
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-zinc-400">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8">
        <p className="text-red-400">Failed to load analytics</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-zinc-400">Platform statistics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <p className="text-zinc-400 text-sm mb-1">Total Users</p>
          <p className="text-3xl font-bold text-white">{analytics.totalUsers}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <p className="text-zinc-400 text-sm mb-1">Total Purchases</p>
          <p className="text-3xl font-bold text-white">{analytics.totalPurchases}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <p className="text-zinc-400 text-sm mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-white">{formatNaira(analytics.totalRevenue)}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <p className="text-zinc-400 text-sm mb-1">Avg Purchase Value</p>
          <p className="text-2xl font-bold text-white">
            {formatNaira(Math.round(analytics.averagePurchaseValue))}
          </p>
        </div>
      </div>

      {/* Content Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <p className="text-zinc-400 text-sm mb-1">Published Comics</p>
          <p className="text-3xl font-bold text-white">{analytics.totalComics}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <p className="text-zinc-400 text-sm mb-1">Published Animations</p>
          <p className="text-3xl font-bold text-white">{analytics.totalAnimations}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <p className="text-zinc-400 text-sm mb-1">Published Games</p>
          <p className="text-3xl font-bold text-white">{analytics.totalGames}</p>
        </div>
      </div>

      {/* Top Comics */}
      {analytics.topComics.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h2 className="text-xl font-bold text-white">Top Comic Issues</h2>
          </div>
          <table className="w-full">
            <thead className="border-b border-zinc-800 bg-zinc-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Purchases
                </th>
              </tr>
            </thead>
            <tbody>
              {analytics.topComics.map((comic) => (
                <tr key={comic.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                  <td className="px-6 py-4 text-white">{comic.title}</td>
                  <td className="px-6 py-4 text-zinc-400">{comic.purchase_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
