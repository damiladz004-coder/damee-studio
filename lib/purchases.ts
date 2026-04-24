import type { User } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "./supabase-admin";

const COMMISSION_RATE = 0.4;

type PurchaseIssue = {
  id: string;
  title: string;
  issue_number: number;
  comic_id: string;
  price_naira: number;
  comics: { title: string } | { title: string }[] | null;
};

function issueComicTitle(issue: PurchaseIssue) {
  if (!issue.comics) return "Untitled comic";
  return Array.isArray(issue.comics) ? issue.comics[0]?.title ?? "Untitled comic" : issue.comics.title;
}

export async function purchaseIssueForUser(params: {
  issueId: string;
  paymentReference?: string | null;
  user: Pick<User, "id">;
}) {
  const supabase = createSupabaseAdmin();
  const issueQuery = await supabase
    .from("comic_issues")
    .select("id, title, issue_number, comic_id, price_naira, comics(title)")
    .eq("id", params.issueId)
    .neq("status", "draft")
    .single<PurchaseIssue>();

  if (issueQuery.error || !issueQuery.data) {
    return { error: "Issue not found" as const };
  }

  const issue = issueQuery.data;
  const existingPurchase = await supabase
    .from("purchases")
    .select("id")
    .eq("user_id", params.user.id)
    .eq("comic_issue_id", params.issueId)
    .maybeSingle();

  if (existingPurchase.data) {
    return { error: "Issue already purchased" as const };
  }

  const purchaseInsert = await supabase
    .from("purchases")
    .insert({
      user_id: params.user.id,
      comic_issue_id: params.issueId,
      amount_naira: issue.price_naira,
      payment_reference: params.paymentReference ?? null,
    })
    .select()
    .single();

  if (purchaseInsert.error || !purchaseInsert.data) {
    return { error: purchaseInsert.error?.message ?? "Unable to save purchase" as const };
  }

  const purchase = purchaseInsert.data;

  const buyerWalletQuery = await supabase
    .from("wallets")
    .select("id")
    .eq("user_id", params.user.id)
    .single();

  if (buyerWalletQuery.data) {
    await supabase.from("transactions").insert({
      user_id: params.user.id,
      wallet_id: buyerWalletQuery.data.id,
      purchase_id: purchase.id,
      transaction_type: "purchase",
      transaction_status: "completed",
      amount_naira: -issue.price_naira,
      description: `Purchase of ${issueComicTitle(issue)} issue ${issue.issue_number}`,
      metadata: {
        comic_issue_id: issue.id,
        issue_title: issue.title,
        issue_number: issue.issue_number,
      },
    });
  }

  const referralQuery = await supabase
    .from("referrals")
    .select("referrer_id")
    .eq("referred_user_id", params.user.id)
    .maybeSingle();

  if (referralQuery.data?.referrer_id) {
    const qualifyingPurchase = await supabase
      .from("purchases")
      .select("id")
      .eq("user_id", referralQuery.data.referrer_id)
      .eq("comic_issue_id", params.issueId)
      .maybeSingle();

    if (qualifyingPurchase.data) {
      const commissionAmount = Math.round(issue.price_naira * COMMISSION_RATE);
      const referrerWalletQuery = await supabase
        .from("wallets")
        .select("id, available_balance, lifetime_earnings")
        .eq("user_id", referralQuery.data.referrer_id)
        .single();

      if (referrerWalletQuery.data) {
        await supabase
          .from("wallets")
          .update({
            available_balance: referrerWalletQuery.data.available_balance + commissionAmount,
            lifetime_earnings: referrerWalletQuery.data.lifetime_earnings + commissionAmount,
          })
          .eq("id", referrerWalletQuery.data.id);

        await supabase.from("transactions").insert({
          user_id: referralQuery.data.referrer_id,
          wallet_id: referrerWalletQuery.data.id,
          purchase_id: purchase.id,
          transaction_type: "referral_commission",
          transaction_status: "completed",
          amount_naira: commissionAmount,
          description: `Referral commission from ${issueComicTitle(issue)} issue ${issue.issue_number}`,
          metadata: {
            buyer_user_id: params.user.id,
            comic_issue_id: issue.id,
            issue_title: issue.title,
            issue_number: issue.issue_number,
            commission_rate: COMMISSION_RATE,
          },
        });
      }
    }
  }

  return { error: null, issue, purchase };
}
