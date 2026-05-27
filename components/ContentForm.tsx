"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type ContentFormProps = {
  contentType: "animation" | "game";
  initialData?: {
    id: string;
    title: string;
    slug: string;
    description: string;
    thumbnail_url: string;
    media_url?: string;
    status: "draft" | "published" | "featured";
  };
  isEditing?: boolean;
};

export default function ContentForm({
  contentType,
  initialData,
  isEditing = false,
}: ContentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    thumbnail_url: initialData?.thumbnail_url || "",
    media_url: initialData?.media_url || "",
    status: (initialData?.status || "draft") as "draft" | "published" | "featured",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-generate slug from title
    if (name === "title" && !isEditing) {
      const slug = value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "");
      setForm((prev) => ({
        ...prev,
        slug,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!form.title || !form.slug || !form.description) {
        throw new Error("Title, slug, and description are required");
      }

      const table = contentType === "animation" ? "animations" : "games";
      const updateData = {
        title: form.title,
        slug: form.slug,
        description: form.description,
        thumbnail_url: form.thumbnail_url,
        media_url: form.media_url,
        status: form.status,
        updated_at: new Date().toISOString(),
      };

      let result;

      if (isEditing && initialData?.id) {
        result = await supabase
          .from(table)
          .update(updateData)
          .eq("id", initialData.id);
      } else {
        result = await supabase.from(table).insert(updateData);
      }

      if (result.error) throw result.error;

      router.push(`/app/${contentType === "animation" ? "animations" : "games"}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const typeLabel = contentType === "animation" ? "Animation" : "Game";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 max-w-2xl"
    >
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            {typeLabel} Title *
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder={`Enter ${typeLabel.toLowerCase()} title`}
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">Slug *</label>
          <input
            type="text"
            name="slug"
            value={form.slug}
            onChange={handleChange}
            placeholder="URL-friendly slug (auto-generated)"
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm"
            required
          />
          <p className="text-xs text-zinc-400 mt-1">
            Will be used in URLs like /{contentType === "animation" ? "animation" : "games"}/{form.slug}
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Description *
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder={`Enter ${typeLabel.toLowerCase()} description`}
            rows={4}
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">Thumbnail URL</label>
          <input
            type="text"
            name="thumbnail_url"
            value={form.thumbnail_url}
            onChange={handleChange}
            placeholder="https://..."
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
          />
          {form.thumbnail_url && (
            <div className="mt-2">
              <img
                src={form.thumbnail_url}
                alt="Thumbnail preview"
                className="w-32 h-40 object-cover rounded-lg"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">Media URL</label>
          <input
            type="text"
            name="media_url"
            value={form.media_url}
            onChange={handleChange}
            placeholder="https://..."
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-2">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="featured">Featured</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors"
        >
          {loading
            ? "Saving..."
            : isEditing
              ? `Update ${typeLabel}`
              : `Create ${typeLabel}`}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
