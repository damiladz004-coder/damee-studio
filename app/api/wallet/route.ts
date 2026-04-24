import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "../../../lib/server-auth";

const MIN_WITHDRAWAL_NAIRA = 5000;

export async function GET(request: NextRequest) {
  const auth = await getRequestUser(request);

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const [walletResult, purchasesResult, transactionsResult] = await Promise.all([
    auth.supabase.from("wallets").select("*").eq("user_id", auth.user.id).single(),
    auth.supabase
      .from("purchases")
      .select("id, comic_issue_id, amount_naira, created_at")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false }),
    auth.supabase
      .from("transactions")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return NextResponse.json({
    wallet: walletResult.data,
    purchases: purchasesResult.data ?? [],
    transactions: transactionsResult.data ?? [],
    minWithdrawalNaira: MIN_WITHDRAWAL_NAIRA,
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await getRequestUser(request);

  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const body = await request.json();
  const action = body.action === "unlock" ? "unlock" : "lock";
  const amount = Number(body.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
  }

  const walletResult = await auth.supabase
    .from("wallets")
    .select("*")
    .eq("user_id", auth.user.id)
    .single();

  if (!walletResult.data) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  const wallet = walletResult.data;
  const availableBalance =
    action === "lock" ? wallet.available_balance - amount : wallet.available_balance + amount;
  const lockedBalance =
    action === "lock" ? wallet.locked_balance + amount : wallet.locked_balance - amount;

  if (availableBalance < 0 || lockedBalance < 0) {
    return NextResponse.json({ error: "Insufficient balance for that action" }, { status: 400 });
  }

  const updateResult = await auth.supabase
    .from("wallets")
    .update({
      available_balance: availableBalance,
      locked_balance: lockedBalance,
    })
    .eq("id", wallet.id)
    .select()
    .single();

  if (updateResult.error || !updateResult.data) {
    return NextResponse.json(
      { error: updateResult.error?.message ?? "Unable to update wallet" },
      { status: 400 },
    );
  }

  await auth.supabase.from("transactions").insert({
    user_id: auth.user.id,
    wallet_id: wallet.id,
    transaction_type: action === "lock" ? "locked_transfer" : "unlock_transfer",
    transaction_status: "completed",
    amount_naira: amount,
    description:
      action === "lock" ? "Moved earnings into locked balance" : "Moved earnings back to available balance",
    metadata: { action },
  });

  return NextResponse.json({ ok: true, wallet: updateResult.data });
}
