import Link from "next/link";
import { Suspense } from "react";
import AuthForm from "../../../components/AuthForm";

export default function SignupPage() {
  return (
    <main>
      <Suspense>
        <AuthForm title="Create Account" buttonText="Sign Up" mode="signup" />
      </Suspense>
      <p className="-mt-24 pb-16 text-center text-sm text-zinc-400">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-[var(--accent-strong)]">
          Login
        </Link>
      </p>
    </main>
  );
}
