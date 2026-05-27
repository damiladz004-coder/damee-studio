"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../../lib/supabase";
import ComicForm from "../../../../../components/ComicForm";
import type { ContentItem } from "../../../../../lib/types";

export default function EditComicPage({ params }: { params: { id: string } }) {
  const [comic, setComic] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComic();
  }, [params.id]);

  async function loadComic() {
    try {
      const { data, error } = await supabase
        .from("comics")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error) throw error;
      setComic({
        ...data,
        kind: "comic" as const,
      });
    } catch (error) {
      console.error("Failed to load comic:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-zinc-400">Loading comic...</p>
      </div>
    );
  }

  if (!comic) {
    return (
      <div className="p-8">
        <p className="text-red-400">Comic not found</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Edit Comic</h1>
        <p className="text-zinc-400">Update comic information</p>
      </div>

      <ComicForm
        initialData={{
          id: comic.id,
          title: comic.title,
          slug: comic.slug,
          description: comic.description,
          thumbnail_url: comic.thumbnail_url || "",
          status: comic.status as "draft" | "published" | "featured",
        }}
        isEditing
      />
    </div>
  );
}
