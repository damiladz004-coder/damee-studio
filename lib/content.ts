import {
  featuredContent,
  getDemoByKind,
  getDemoBySlug,
  getDemoIssuesByComicId,
} from "./demo-data";
import { isSupabaseConfigured, supabase } from "./supabase";
import type { ComicIssue, ContentItem, ContentKind } from "./types";

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

export async function getComicIssues(comicId: string): Promise<ComicIssue[]> {
  if (!isSupabaseConfigured) return getDemoIssuesByComicId(comicId);

  const { data, error } = await supabase
    .from("comic_issues")
    .select("*")
    .eq("comic_id", comicId)
    .eq("status", "published")
    .order("issue_number", { ascending: true });

  if (error || !data?.length) return getDemoIssuesByComicId(comicId);

  return data;
}

export async function getPublishedComicIssues(): Promise<ComicIssue[]> {
  if (!isSupabaseConfigured) return getDemoIssuesByComicId("comic-eagles-watch");

  const { data, error } = await supabase
    .from("comic_issues")
    .select("*")
    .eq("status", "published")
    .order("release_date", { ascending: false })
    .order("issue_number", { ascending: false });

  if (error || !data?.length) return getDemoIssuesByComicId("comic-eagles-watch");

  return data;
}
