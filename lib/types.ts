export type ContentKind = "comic" | "animation" | "game";
export type TransactionType =
  | "purchase"
  | "referral_commission"
  | "reward"
  | "withdrawal"
  | "locked_transfer"
  | "unlock_transfer";

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
  comic_issue_id?: string | null;
  page_number: number;
  image_url: string;
};

export type ComicIssue = {
  id: string;
  comic_id: string;
  title: string;
  slug: string;
  issue_number: number;
  summary: string | null;
  price_naira: number;
  status: "featured" | "published" | "draft";
  release_date?: string | null;
  created_at?: string;
};

export type Purchase = {
  id: string;
  user_id: string;
  comic_issue_id: string;
  amount_naira: number;
  payment_reference?: string | null;
  created_at: string;
};

export type Wallet = {
  id: string;
  user_id: string;
  available_balance: number;
  locked_balance: number;
  lifetime_earnings: number;
  created_at: string;
  updated_at: string;
};

export type WalletTransaction = {
  id: string;
  user_id: string;
  wallet_id: string;
  purchase_id?: string | null;
  transaction_type: TransactionType;
  transaction_status: "pending" | "completed" | "failed";
  amount_naira: number;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type GameQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
};

export type GameScore = {
  id: string;
  user_id: string;
  comic_issue_id: string;
  game_slug: string;
  score: number;
  created_at: string;
};

export type LeaderboardEntry = {
  id: string;
  comic_issue_id: string;
  game_slug: string;
  user_id: string;
  rank: number;
  score: number;
  reward_amount_naira: number;
  created_at: string;
  profiles?: Pick<Profile, "display_name" | "username" | "avatar_url"> | null;
};

export type Comment = {
  id: string;
  content_id: string;
  content_type: ContentKind;
  body: string;
  created_at: string;
  profiles?: Pick<Profile, "display_name" | "username" | "avatar_url"> | null;
};
