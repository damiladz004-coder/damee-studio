import { featuredContent, getDemoByKind, getDemoBySlug } from "./demo-data";
import { isSupabaseConfigured, supabase } from "./supabase";
import type { ContentItem, ContentKind } from "./types";

const tableByKind: Record<ContentKind, string> = {
  comic: "comics",
  animation: "animations",
  game: "games",
};

export async function getContentByKind(kind: ContentKind): Promise<ContentItem[]> {
  if (!isSupabaseConfigured) return getDemoByKind(kind);

  const { data, error } = await supabase
    .from(tableByKind[kind])
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error || !data?.length) return getDemoByKind(kind);

  return data.map((item) => ({ ...item, kind }));
}

export async function getFeaturedContent(): Promise<ContentItem[]> {
  if (!isSupabaseConfigured) return featuredContent;

  const [comics, animations, games] = await Promise.all([
    getContentByKind("comic"),
    getContentByKind("animation"),
    getContentByKind("game"),
  ]);

  return [...comics, ...animations, ...games].slice(0, 6);
}

export async function getContentBySlug(
  kind: ContentKind,
  slug: string,
): Promise<ContentItem | null> {
  if (!isSupabaseConfigured) return getDemoBySlug(slug) ?? null;

  const { data, error } = await supabase
    .from(tableByKind[kind])
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return getDemoBySlug(slug) ?? null;

  return { ...data, kind };
}
