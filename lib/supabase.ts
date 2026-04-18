import { createClient } from "@supabase/supabase-js";
import type { Profile } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey,
);

export const supabase = createClient(
  supabaseUrl || "https://example.supabase.co",
  supabasePublishableKey || "missing-publishable-key",
);

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}
