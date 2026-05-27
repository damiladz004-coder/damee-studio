"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import type { ContentItem } from "../../../lib/types";

export default function GamesPage() {
  const [games, setGames] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, []);

  async function loadGames() {
    try {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGames(
        (data ?? []).map((g) => ({
          ...g,
          kind: "game" as const,
        }))
      );
    } catch (error) {
      console.error("Failed to load games:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteGame(id: string) {
    if (!confirm("Are you sure you want to delete this game?")) return;

    try {
      const { error } = await supabase.from("games").delete().eq("id", id);
      if (error) throw error;
      setGames(games.filter((g) => g.id !== id));
    } catch (error) {
      console.error("Failed to delete game:", error);
      alert("Failed to delete game");
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-500/20 text-green-300";
      case "featured":
        return "bg-yellow-500/20 text-yellow-300";
      case "draft":
        return "bg-zinc-500/20 text-zinc-300";
      default:
        return "bg-zinc-500/20 text-zinc-300";
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Games</h1>
          <p className="text-zinc-400">Manage all game content</p>
        </div>
        <Link
          href="/app/games/create"
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          + New Game
        </Link>
      </div>

      {loading ? (
        <div className="text-zinc-400">Loading games...</div>
      ) : games.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
          <p className="text-zinc-400 mb-4">No games yet</p>
          <Link href="/app/games/create" className="text-green-400 hover:text-green-300">
            Create the first game →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-zinc-900 border border-zinc-800 rounded-lg">
          <table className="w-full">
            <thead className="border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Slug
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                  Created
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr key={game.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                  <td className="px-6 py-4 text-white">{game.title}</td>
                  <td className="px-6 py-4 text-zinc-400 font-mono text-sm">{game.slug}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(game.status)}`}
                    >
                      {game.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-sm">
                    {game.created_at ? new Date(game.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/app/games/${game.id}`}
                        className="text-green-400 hover:text-green-300 text-sm"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => deleteGame(game.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </div>
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
