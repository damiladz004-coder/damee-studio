"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import type { ContentItem } from "../../../lib/types";

export default function AnimationsPage() {
  const [animations, setAnimations] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnimations();
  }, []);

  async function loadAnimations() {
    try {
      const { data, error } = await supabase
        .from("animations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnimations(
        (data ?? []).map((a) => ({
          ...a,
          kind: "animation" as const,
        }))
      );
    } catch (error) {
      console.error("Failed to load animations:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteAnimation(id: string) {
    if (!confirm("Are you sure you want to delete this animation?")) return;

    try {
      const { error } = await supabase.from("animations").delete().eq("id", id);
      if (error) throw error;
      setAnimations(animations.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Failed to delete animation:", error);
      alert("Failed to delete animation");
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
          <h1 className="text-3xl font-bold text-white mb-2">Animations</h1>
          <p className="text-zinc-400">Manage all animation content</p>
        </div>
        <Link
          href="/app/animations/create"
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          + New Animation
        </Link>
      </div>

      {loading ? (
        <div className="text-zinc-400">Loading animations...</div>
      ) : animations.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
          <p className="text-zinc-400 mb-4">No animations yet</p>
          <Link
            href="/app/animations/create"
            className="text-purple-400 hover:text-purple-300"
          >
            Create the first animation →
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
              {animations.map((animation) => (
                <tr key={animation.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                  <td className="px-6 py-4 text-white">{animation.title}</td>
                  <td className="px-6 py-4 text-zinc-400 font-mono text-sm">{animation.slug}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(animation.status)}`}
                    >
                      {animation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-sm">
                    {animation.created_at ? new Date(animation.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/app/animations/${animation.id}`}
                        className="text-purple-400 hover:text-purple-300 text-sm"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => deleteAnimation(animation.id)}
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
