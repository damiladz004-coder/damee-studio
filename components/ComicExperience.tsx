"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatNaira } from "../lib/format";
import { supabase } from "../lib/supabase";
import type { ComicIssue, ComicPage, ContentItem, Purchase } from "../lib/types";

type ComicExperienceProps = {
  comic: ContentItem;
  issues: ComicIssue[];
  previewPages: ComicPage[];
};

export default function ComicExperience({
  comic,
  issues,
  previewPages,
}: ComicExperienceProps) {
  const [selectedIssueId, setSelectedIssueId] = useState(issues[0]?.id ?? "");
  const [ownedIssueIds, setOwnedIssueIds] = useState<string[]>([]);
  const [pages, setPages] = useState<ComicPage[]>([]);
  const [status, setStatus] = useState("");
  const [loadingPages, setLoadingPages] = useState(false);
  const [buyingIssueId, setBuyingIssueId] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const selectedIssue = issues.find((issue) => issue.id === selectedIssueId) ?? issues[0] ?? null;
  const isOwned = selectedIssue ? ownedIssueIds.includes(selectedIssue.id) : false;
  const issueIsFree = selectedIssue?.price_naira === 0;

  useEffect(() => {
    let active = true;

    async function loadWallet() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      setIsAuthenticated(Boolean(session));

      if (!session) {
        setOwnedIssueIds([]);
        return;
      }

      const response = await fetch("/api/wallet", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) return;

      const payload = (await response.json()) as { purchases?: Purchase[] };
      const purchases = payload.purchases ?? [];

      if (active) {
        setOwnedIssueIds(purchases.map((purchase) => purchase.comic_issue_id));
      }
    }

    loadWallet();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadPages() {
      if (!selectedIssue) {
        setPages(previewPages);
        return;
      }

      if (!issueIsFree && !isOwned) {
        setPages([]);
        return;
      }

      setLoadingPages(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch(`/api/comic-issues/${selectedIssue.id}/pages`, {
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
      });

      if (!active) return;

      if (!response.ok) {
        setPages([]);
        setLoadingPages(false);
        return;
      }

      const payload = (await response.json()) as { pages: ComicPage[] };
      setPages(payload.pages.length ? payload.pages : previewPages);
      setLoadingPages(false);
    }

    loadPages();

    return () => {
      active = false;
    };
  }, [isOwned, issueIsFree, previewPages, selectedIssue]);

  async function purchaseSelectedIssue() {
    if (!selectedIssue) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setStatus("Sign in to unlock this issue.");
      return;
    }

    setBuyingIssueId(selectedIssue.id);
    const response = await fetch("/api/payments/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        issueId: selectedIssue.id,
        redirectPath: window.location.pathname,
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      authorizationUrl?: string;
    };

    if (!response.ok || !payload.authorizationUrl) {
      setStatus(payload.error ?? "Unable to complete purchase.");
      setBuyingIssueId("");
      return;
    }

    window.location.href = payload.authorizationUrl;
  }

  return (
    <main>
      <section className="section-shell grid gap-8 lg:grid-cols-[22rem_1fr]">
        <aside className="space-y-6">
          <div>
            <p className="eyebrow">Comic reader</p>
            <h1 className="mt-3 text-5xl font-black uppercase leading-none text-white">
              {comic.title}
            </h1>
            <p className="mt-5 text-zinc-400">{comic.description}</p>
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase">Issues</h2>
              <Link href="/referral" className="text-sm text-[var(--accent-strong)]">
                Earn from referrals
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {issues.map((issue) => {
                const owned = ownedIssueIds.includes(issue.id) || issue.price_naira === 0;
                const active = selectedIssueId === issue.id;

                return (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => setSelectedIssueId(issue.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-[var(--accent-strong)] bg-[rgba(71,181,255,0.08)]"
                        : "border-white/10 bg-zinc-950"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
                          Issue {issue.issue_number}
                        </p>
                        <p className="mt-2 text-lg font-black uppercase text-white">
                          {issue.title}
                        </p>
                        {issue.summary ? (
                          <p className="mt-2 text-sm leading-6 text-zinc-400">{issue.summary}</p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[var(--accent-strong)]">
                          {formatNaira(issue.price_naira)}
                        </p>
                        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                          {owned ? "Unlocked" : "Locked"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedIssue ? (
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-sm text-zinc-400">
                    {isOwned || issueIsFree
                      ? "This issue is unlocked on your account."
                      : "Purchase this issue to unlock the full reader and qualify your referrals for commissions when they buy the same issue."}
                  </p>
                </div>
                {!isOwned && !issueIsFree ? (
                  <button
                    type="button"
                    className="btn btn-primary w-full"
                    onClick={purchaseSelectedIssue}
                    disabled={buyingIssueId === selectedIssue.id}
                  >
                    {buyingIssueId === selectedIssue.id
                      ? "Unlocking..."
                      : `Unlock for ${formatNaira(selectedIssue.price_naira)}`}
                  </button>
                ) : null}
                {!isAuthenticated && !issueIsFree ? (
                  <Link href="/auth/login" className="btn btn-secondary w-full">
                    Sign in to buy
                  </Link>
                ) : null}
              </div>
            ) : null}

            {status ? <p className="mt-4 text-sm text-zinc-400">{status}</p> : null}
          </div>
        </aside>

        <section className="space-y-6">
          {(isOwned || issueIsFree) && pages.length > 0 ? (
            pages.map((page) => (
              <Image
                key={page.id}
                src={page.image_url}
                alt={`${comic.title} page ${page.page_number}`}
                width={1200}
                height={1600}
                className="mx-auto w-full rounded-lg border border-white/10 bg-zinc-950 object-cover"
                sizes="(min-width: 1024px) 960px, 100vw"
              />
            ))
          ) : (
            <div className="panel flex min-h-[24rem] items-center justify-center p-8 text-center">
              <div>
                <p className="eyebrow">Locked issue</p>
                <h2 className="mt-3 text-4xl font-black uppercase text-white">
                  Unlock the full story
                </h2>
                <p className="mt-4 max-w-xl text-zinc-400">
                  Buy this issue to read every page, support original African storytelling,
                  and activate referral commission eligibility for matching purchases.
                </p>
              </div>
            </div>
          )}

          {loadingPages ? <p className="text-sm text-zinc-500">Loading pages...</p> : null}
        </section>
      </section>
    </main>
  );
}
