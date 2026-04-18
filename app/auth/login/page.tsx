import Link from "next/link";
import { Suspense } from "react";
import AuthForm from "../../../components/AuthForm";

export default function LoginPage() {
  return (
    <main>
      <Suspense>
        <AuthForm title="Welcome Back" buttonText="Login" mode="login" />
      </Suspense>
      <p className="-mt-24 pb-16 text-center text-sm text-zinc-400">
        Do not have an account?{" "}
        <Link href="/auth/signup" className="text-[var(--accent-strong)]">
          Sign up
        </Link>
      </p>
    </main>
  );
}
