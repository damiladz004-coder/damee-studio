"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, getCurrentProfile } from "../lib/supabase";
import type { Profile } from "../lib/types";

export default function AdminProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/auth/login");
        return;
      }

      const profile = await getCurrentProfile();
      if (profile?.role !== "admin") {
        router.push("/");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    }

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <main className="section-shell">
        <p className="text-zinc-400">Verifying admin access...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
