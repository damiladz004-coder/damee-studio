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

export type ComicIssue = {
  id: string;
  comic_id: string;
  title: string;
  slug: string;
  issue_number: number;
  summary: string | null;
  price_naira: number;
  status?: "draft" | "published" | "featured";
};

export type Wallet = {
  id: string;
  user_id: string;
  available_balance: number;
  locked_balance: number;
  lifetime_earnings: number;
};

export type Purchase = {
  id: string;
  comic_issue_id: string;
  amount_naira: number;
  created_at: string;
};

export type Profile = {
  id: string;
  display_name: string | null;
  username: string | null;
  referral_code: string;
  referral_count: number;
};
