"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function PaymentVerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("Verifying payment...");

  useEffect(() => {
    let active = true;

    async function verify() {
      const issueId = searchParams.get("issueId") ?? "";
      const reference =
        searchParams.get("reference") ?? searchParams.get("trxref") ?? "";
      const redirectPath = searchParams.get("redirect") ?? "/dashboard";

      if (!issueId || !reference) {
        setStatus("Missing payment reference or issue information.");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setStatus("Sign in again to finish payment verification.");
        return;
      }

      const response = await fetch("/api/payments/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ issueId, reference }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!active) return;

      if (!response.ok && response.status !== 409) {
        setStatus(payload.error ?? "Unable to verify payment.");
        return;
      }

      setStatus("Payment verified. Unlocking your issue...");
      window.setTimeout(() => router.replace(redirectPath), 1200);
    }

    verify();

    return () => {
      active = false;
    };
  }, [router, searchParams]);

  return (
    <main className="section-shell">
      <div className="panel max-w-xl p-6">
        <p className="eyebrow">Payment</p>
        <h1 className="mt-3 text-4xl font-black uppercase">Checkout status</h1>
        <p className="mt-4 text-zinc-400">{status}</p>
        <Link href="/dashboard" className="btn btn-secondary mt-6 inline-flex">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
