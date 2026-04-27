"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/auth/login");
        return;
      }

      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <main className="section-shell">
        <p className="text-zinc-400">Checking your session...</p>
      </main>
    );
  }

  return <>{children}</>;
}
