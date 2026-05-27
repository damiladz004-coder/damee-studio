"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import type { ContentItem } from "../../../lib/types";

export default function ComicsPage() {
  const [comics, setComics] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComics();
  }, []);

  async function loadComics() {
    try {
      const { data, error } = await supabase
        .from("comics")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComics(
        (data ?? []).map((c) => ({
          ...c,
          kind: "comic" as const,
        }))
      );
    } catch (error) {
      console.error("Failed to load comics:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteComic(id: string) {
    if (!confirm("Are you sure you want to delete this comic?")) return;

    try {
      const { error } = await supabase.from("comics").delete().eq("id", id);
      if (error) throw error;
      setComics(comics.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Failed to delete comic:", error);
      alert("Failed to delete comic");
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
          <h1 className="text-3xl font-bold text-white mb-2">Comics</h1>
          <p className="text-zinc-400">Manage all comics content</p>
        </div>
        <Link
          href="/app/comics/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          + New Comic
        </Link>
      </div>

      {loading ? (
        <div className="text-zinc-400">Loading comics...</div>
      ) : comics.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
          <p className="text-zinc-400 mb-4">No comics yet</p>
          <Link
            href="/app/comics/create"
            className="text-blue-400 hover:text-blue-300"
          >
            Create the first comic →
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
              {comics.map((comic) => (
                <tr key={comic.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                  <td className="px-6 py-4 text-white">{comic.title}</td>
                  <td className="px-6 py-4 text-zinc-400 font-mono text-sm">{comic.slug}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(comic.status)}`}>
                      {comic.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-sm">
                    {comic.created_at ? new Date(comic.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/app/comics/${comic.id}`}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/app/comics/${comic.id}/issues`}
                        className="text-purple-400 hover:text-purple-300 text-sm"
                      >
                        Issues
                      </Link>
                      <button
                        onClick={() => deleteComic(comic.id)}
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
