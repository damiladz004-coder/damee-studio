"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import UploadForm from "../../components/UploadForm";
import { getCurrentProfile } from "../../lib/supabase";
import type { Profile } from "../../lib/types";

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    getCurrentProfile().then(setProfile);
  }, []);

  const referralUrl = useMemo(() => {
    if (!profile?.referral_code) return "";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    return `${siteUrl}/auth/signup?ref=${profile.referral_code}`;
  }, [profile]);

  async function copyReferral() {
    if (referralUrl) await navigator.clipboard.writeText(referralUrl);
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
            ["Profile", profile?.display_name ?? profile?.username ?? "Reader"],
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

        {profile?.role === "admin" && (
          <section className="mt-8">
            <h2 className="mb-4 text-2xl font-black uppercase">Admin upload</h2>
            <UploadForm />
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
