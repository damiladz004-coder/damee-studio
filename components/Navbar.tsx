"use client";

import { useState } from "react";
import Link from "next/link";

const links = [
  ["Comics", "/comics"],
  ["Animation", "/animation"],
  ["Games", "/games"],
  ["Dashboard", "/dashboard"],
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

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
          <Link href="/auth/login" className="btn btn-secondary">
            Login
          </Link>
          <Link href="/auth/signup" className="btn btn-primary">
            Sign up
          </Link>
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
            <Link href="/auth/login" className="btn btn-secondary">
              Login
            </Link>
            <Link href="/auth/signup" className="btn btn-primary">
              Sign up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
