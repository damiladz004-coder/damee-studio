"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../../lib/supabase";
import ContentForm from "../../../../../components/ContentForm";
import type { ContentItem } from "../../../../../lib/types";

export default function EditGamePage({ params }: { params: { id: string } }) {
  const [game, setGame] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGame();
  }, [params.id]);

  async function loadGame() {
    try {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error) throw error;
      setGame({
        ...data,
        kind: "game" as const,
      });
    } catch (error) {
      console.error("Failed to load game:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-zinc-400">Loading game...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="p-8">
        <p className="text-red-400">Game not found</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Edit Game</h1>
        <p className="text-zinc-400">Update game information</p>
      </div>

      <ContentForm
        contentType="game"
        initialData={{
          id: game.id,
          title: game.title,
          slug: game.slug,
          description: game.description,
          thumbnail_url: game.thumbnail_url || "",
          media_url: game.media_url,
          status: game.status as "draft" | "published" | "featured",
        }}
        isEditing
      />
    </div>
  );
}
