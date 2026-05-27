"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../../lib/supabase";
import ContentForm from "../../../../../components/ContentForm";
import type { ContentItem } from "../../../../../lib/types";

export default function EditAnimationPage({ params }: { params: { id: string } }) {
  const [animation, setAnimation] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnimation();
  }, [params.id]);

  async function loadAnimation() {
    try {
      const { data, error } = await supabase
        .from("animations")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error) throw error;
      setAnimation({
        ...data,
        kind: "animation" as const,
      });
    } catch (error) {
      console.error("Failed to load animation:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-zinc-400">Loading animation...</p>
      </div>
    );
  }

  if (!animation) {
    return (
      <div className="p-8">
        <p className="text-red-400">Animation not found</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Edit Animation</h1>
        <p className="text-zinc-400">Update animation information</p>
      </div>

      <ContentForm
        contentType="animation"
        initialData={{
          id: animation.id,
          title: animation.title,
          slug: animation.slug,
          description: animation.description,
          thumbnail_url: animation.thumbnail_url || "",
          media_url: animation.media_url,
          status: animation.status as "draft" | "published" | "featured",
        }}
        isEditing
      />
    </div>
  );
}
