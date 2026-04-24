import type { NextRequest } from "next/server";
import { createSupabaseAdmin } from "./supabase-admin";

export async function getRequestUser(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return { supabase: createSupabaseAdmin(), user: null, error: "Authentication required" };
  }

  const supabase = createSupabaseAdmin();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { supabase, user: null, error: "Invalid session" };
  }

  return { supabase, user, error: null };
}

export async function getAdminRequestUser(request: NextRequest) {
  const auth = await getRequestUser(request);

  if (!auth.user) {
    return auth;
  }

  const { data: profile } = await auth.supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();

  if (profile?.role !== "admin") {
    return { ...auth, user: null, error: "Admin role required" };
  }

  return auth;
}
