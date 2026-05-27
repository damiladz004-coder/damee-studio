"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/app", icon: "📊" },
  { label: "Comics", href: "/app/comics", icon: "📚" },
  { label: "Animations", href: "/app/animations", icon: "🎬" },
  { label: "Games", href: "/app/games", icon: "🎮" },
  { label: "Rewards", href: "/app/rewards", icon: "🏆" },
  { label: "Users", href: "/app/users", icon: "👥" },
  { label: "Analytics", href: "/app/analytics", icon: "📈" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 h-screen overflow-y-auto sticky top-0">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-white">Damee Admin</h1>
      </div>

      <nav className="p-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-800">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
