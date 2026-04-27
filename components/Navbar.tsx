"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";

const links = [
  ["Comics", "/comics"],
  ["Animation", "/animation"],
  ["Games", "/games"],
  ["Dashboard", "/dashboard"],
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthenticated(Boolean(data.session));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setAuthenticated(Boolean(session));
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-black uppercase text-white">
          Damee<span className="text-[var(--accent-strong)]">Studio</span>
        </Link>

        <div className="hidden items-center gap-6 text-sm font-bold text-zinc-300 md:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-white">
              {label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {!authenticated ? (
            <>
              <Link href="/auth/login" className="btn btn-secondary">
                Login
              </Link>
              <Link href="/auth/signup" className="btn btn-primary">
                Sign up
              </Link>
            </>
          ) : (
            <button className="btn btn-secondary" onClick={handleSignOut}>
              Sign out
            </button>
          )}
        </div>

        <button className="btn btn-secondary md:hidden" onClick={() => setOpen(true)}>
          Menu
        </button>
      </nav>

      {open && (
        <div className="fixed inset-0 min-h-screen bg-black p-6 md:hidden">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-lg font-black uppercase">
              Damee Studio
            </Link>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <div className="mt-12 grid gap-4 text-2xl font-black uppercase">
            {links.map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}>
                {label}
              </Link>
            ))}
          </div>
          <div className="mt-10 grid gap-3">
            {!authenticated ? (
              <>
                <Link href="/auth/login" className="btn btn-secondary">
                  Login
                </Link>
                <Link href="/auth/signup" className="btn btn-primary">
                  Sign up
                </Link>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={handleSignOut}>
                Sign out
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
