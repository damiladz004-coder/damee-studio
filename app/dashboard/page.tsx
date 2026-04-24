"use client";

import { useEffect, useMemo, useState } from "react";
import { formatNaira } from "../../lib/format";
import ProtectedRoute from "../../components/ProtectedRoute";
import UploadForm from "../../components/UploadForm";
import { getCurrentProfile, supabase } from "../../lib/supabase";
import type { Profile, Purchase, Wallet, WalletTransaction } from "../../lib/types";

type WalletPayload = {
  wallet: Wallet | null;
  purchases: Purchase[];
  transactions: WalletTransaction[];
  minWithdrawalNaira: number;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [walletData, setWalletData] = useState<WalletPayload | null>(null);
  const [walletStatus, setWalletStatus] = useState("");
  const [rewardIssueId, setRewardIssueId] = useState("");
  const [rewardGameSlug, setRewardGameSlug] = useState("issue-quiz");
  const [rewardStatus, setRewardStatus] = useState("");

  useEffect(() => {
    getCurrentProfile().then(setProfile);
    loadWallet();
  }, []);

  async function loadWallet() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const response = await fetch("/api/wallet", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!response.ok) return;

    setWalletData((await response.json()) as WalletPayload);
  }

  const referralUrl = useMemo(() => {
    if (!profile?.referral_code) return "";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    return `${siteUrl}/auth/signup?ref=${profile.referral_code}`;
  }, [profile]);

  async function copyReferral() {
    if (referralUrl) await navigator.clipboard.writeText(referralUrl);
  }

  async function moveBalance(action: "lock" | "unlock") {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const sourceBalance =
      action === "lock"
        ? walletData?.wallet?.available_balance ?? 0
        : walletData?.wallet?.locked_balance ?? 0;

    if (!session || sourceBalance <= 0) {
      setWalletStatus("No balance available for that action yet.");
      return;
    }

    const response = await fetch("/api/wallet", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, amount: sourceBalance }),
    });

    const payload = (await response.json()) as { error?: string };
    setWalletStatus(
      response.ok
        ? action === "lock"
          ? "Available earnings moved into locked balance."
          : "Locked earnings moved back to available balance."
        : (payload.error ?? "Unable to update wallet."),
    );

    if (response.ok) {
      await loadWallet();
    }
  }

  async function settleRewards() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !rewardIssueId) {
      setRewardStatus("Enter a comic issue ID to settle rewards.");
      return;
    }

    const response = await fetch("/api/admin/rewards/settle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        comicIssueId: rewardIssueId,
        gameSlug: rewardGameSlug,
      }),
    });

    const payload = (await response.json()) as { error?: string; settledCount?: number };
    setRewardStatus(
      response.ok
        ? `Settled ${payload.settledCount ?? 0} leaderboard reward(s).`
        : (payload.error ?? "Unable to settle rewards."),
    );
  }

  return (
    <ProtectedRoute>
      <main className="section-shell">
        <div className="section-heading">
          <p className="eyebrow">Dashboard</p>
          <h1>Studio control room</h1>
          <p>
            Manage your profile, referral link, and admin publishing tools from
            one place.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            ["Role", profile?.role ?? "user"],
            ["Referrals", String(profile?.referral_count ?? 0)],
            ["Wallet", formatNaira(walletData?.wallet?.available_balance ?? 0)],
          ].map(([label, value]) => (
            <div key={label} className="panel p-5">
              <p className="text-sm text-zinc-500">{label}</p>
              <p className="mt-2 text-3xl font-black uppercase">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 panel p-5">
          <h2 className="text-2xl font-black uppercase">Referral link</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Invite readers and track successful signups in Supabase.
          </p>
          <div className="mt-5 flex flex-col gap-3 md:flex-row">
            <input className="field" value={referralUrl} readOnly />
            <button className="btn btn-primary md:w-44" onClick={copyReferral}>
              Copy
            </button>
          </div>
        </section>

        <section className="mt-8 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
          <div className="panel p-5">
            <h2 className="text-2xl font-black uppercase">Wallet</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Referral commissions land here. Minimum withdrawal threshold is{" "}
              {formatNaira(walletData?.minWithdrawalNaira ?? 5000)}.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                ["Available", formatNaira(walletData?.wallet?.available_balance ?? 0)],
                ["Locked", formatNaira(walletData?.wallet?.locked_balance ?? 0)],
                ["Lifetime", formatNaira(walletData?.wallet?.lifetime_earnings ?? 0)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-zinc-500">{label}</p>
                  <p className="mt-2 text-2xl font-black uppercase text-white">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-col gap-3 md:flex-row">
              <button className="btn btn-secondary md:w-52" onClick={() => moveBalance("lock")}>
                Lock earnings
              </button>
              <button className="btn btn-secondary md:w-52" onClick={() => moveBalance("unlock")}>
                Unlock earnings
              </button>
            </div>
            {walletStatus ? <p className="mt-4 text-sm text-zinc-400">{walletStatus}</p> : null}
          </div>

          <div className="panel p-5">
            <h2 className="text-2xl font-black uppercase">Profile</h2>
            <p className="mt-2 text-zinc-400">
              {profile?.display_name ?? profile?.username ?? "Reader"}
            </p>
            <p className="mt-4 text-sm text-zinc-500">Purchased issues</p>
            <p className="mt-2 text-3xl font-black uppercase text-white">
              {String(walletData?.purchases?.length ?? 0)}
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-4 xl:grid-cols-2">
          <div className="panel p-5">
            <h2 className="text-2xl font-black uppercase">Recent transactions</h2>
            <div className="mt-5 space-y-3">
              {(walletData?.transactions ?? []).slice(0, 6).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div>
                    <p className="font-bold text-white">{transaction.description}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {transaction.transaction_type.replaceAll("_", " ")}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-[var(--accent-strong)]">
                    {formatNaira(transaction.amount_naira)}
                  </p>
                </div>
              ))}
              {!(walletData?.transactions?.length ?? 0) ? (
                <p className="text-sm text-zinc-500">Transactions will appear here after purchases and rewards.</p>
              ) : null}
            </div>
          </div>

          <div className="panel p-5">
            <h2 className="text-2xl font-black uppercase">Commission rule</h2>
            <p className="mt-3 text-zinc-400">
              You earn 40% when a referred reader buys an issue you already own.
              If they keep buying future issues and you own those too, commissions
              continue across the lifetime of that story.
            </p>
          </div>
        </section>

        {profile?.role === "admin" && (
          <section className="mt-8 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="mb-4 text-2xl font-black uppercase">Admin upload</h2>
              <UploadForm />
            </div>
            <div className="panel p-5">
              <h2 className="text-2xl font-black uppercase">Reward settlement</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Credit leaderboard payouts into winner wallets once results are ready.
              </p>
              <div className="mt-5 space-y-3">
                <input
                  className="field"
                  placeholder="Comic issue ID"
                  value={rewardIssueId}
                  onChange={(event) => setRewardIssueId(event.target.value)}
                />
                <input
                  className="field"
                  placeholder="Game slug"
                  value={rewardGameSlug}
                  onChange={(event) => setRewardGameSlug(event.target.value)}
                />
                <button className="btn btn-primary w-full" onClick={settleRewards}>
                  Settle rewards
                </button>
              </div>
              {rewardStatus ? <p className="mt-4 text-sm text-zinc-400">{rewardStatus}</p> : null}
            </div>
          </section>
        )}

        {profile?.role !== "admin" && (
          <section className="mt-8 panel p-5">
            <h2 className="text-2xl font-black uppercase">Admin tools</h2>
            <p className="mt-2 text-zinc-400">
              Admin uploads appear here when your profile role is set to admin.
            </p>
          </section>
        )}
      </main>
    </ProtectedRoute>
  );
}
