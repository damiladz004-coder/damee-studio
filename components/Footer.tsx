import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
        <p>Damee Studio builds connected comics, animation, and games.</p>
        <div className="flex gap-5 text-zinc-300">
          <Link href="/referral">Referral</Link>
          <Link href="/dashboard">Admin</Link>
          <Link href="/auth/signup">Join</Link>
        </div>
      </div>
    </footer>
  );
}
