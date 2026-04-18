export type ContentItem = {
  id: string;
  slug: string;
  kind: "comic" | "animation" | "game";
  title: string;
  description: string;
  thumbnail_url: string;
  media_url?: string;
  status?: "draft" | "published" | "featured";
};
