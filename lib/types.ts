export type ContentKind = "comic" | "animation" | "game";

export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: "admin" | "user";
  referral_code: string;
  referral_count: number;
};

export type ContentItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  kind: ContentKind;
  status: "featured" | "published" | "draft";
  thumbnail_url: string;
  media_url?: string;
  created_at?: string;
};

export type ComicPage = {
  id: string;
  comic_id: string;
  page_number: number;
  image_url: string;
};

export type Comment = {
  id: string;
  content_id: string;
  content_type: ContentKind;
  body: string;
  created_at: string;
  profiles?: Pick<Profile, "display_name" | "username" | "avatar_url"> | null;
};
