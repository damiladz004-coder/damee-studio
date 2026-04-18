"use client";

import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";

type AuthFormProps = {
  title: string;
  buttonText: string;
  mode: "login" | "signup";
};

export default function AuthForm({ title, buttonText, mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref") ?? "";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const referral = String(formData.get("referral") ?? "");

    const { error } =
      mode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            options: { data: { referral_code: referral || null } },
          })
        : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(error.message);
      return;
    }

    if (mode === "signup" && referral) {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      await fetch("/api/referral", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ referralCode: referral }),
      });
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="panel w-full max-w-md p-6">
        <p className="eyebrow">Damee Studio</p>
        <h1 className="mt-3 text-4xl font-black uppercase">{title}</h1>
        <form className="mt-8 space-y-4" onSubmit={submit}>
          <input
            name="email"
            type="email"
            placeholder="Email address"
            className="field"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            className="field"
            minLength={6}
            required
          />
          {mode === "signup" && (
            <input
              name="referral"
              type="text"
              placeholder="Referral code"
              defaultValue={referralCode}
              className="field"
            />
          )}
          <button type="submit" className="btn btn-primary w-full">
            {buttonText}
          </button>
        </form>
      </div>
    </div>
  );
}
