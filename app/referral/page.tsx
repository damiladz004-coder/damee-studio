import Link from "next/link";

export default function ReferralPage() {
  return (
    <main className="section-shell">
      <div className="section-heading">
        <p className="eyebrow">Referral program</p>
        <h1>Bring the next reader in</h1>
        <p>
          Every profile gets a unique invite code. Share your signup link,
          grow the community, and track referral count from your dashboard.
        </p>
      </div>
      <Link href="/dashboard" className="btn btn-primary">
        Open dashboard
      </Link>
    </main>
  );
}
