import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../lib/supabase-admin";

export async function POST(request: NextRequest) {
  const { referralCode } = await request.json();

  if (!referralCode) {
    return NextResponse.json({ error: "Referral code is required" }, { status: 400 });
  }

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  const supabase = createSupabaseAdmin();
  const userResult = token ? await supabase.auth.getUser(token) : null;
  const referredUserId = userResult?.data.user?.id ?? null;

  const { data: referrer } = await supabase
    .from("profiles")
    .select("id")
    .eq("referral_code", referralCode)
    .single();

  if (!referrer) {
    return NextResponse.json({ error: "Referral code not found" }, { status: 404 });
  }

  if (referredUserId && referredUserId === referrer.id) {
    return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 });
  }

  const { error } = await supabase.from("referrals").insert({
    referrer_id: referrer.id,
    referred_user_id: referredUserId,
    referral_code: referralCode,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
