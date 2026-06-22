"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Accessibility, Loader2, Lock, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.replace(params.get("redirect") ?? "/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-surface px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white">
            <Accessibility className="h-8 w-8" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-bold">Admin Sign In</h1>
          <p className="text-sm text-slate-500">Ride Access NYC Dashboard</p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-5">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-5 w-5" aria-hidden /> {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Signing
                in…
              </>
            ) : (
              <>
                <Lock className="h-5 w-5" aria-hidden /> Sign In
              </>
            )}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-400">
          Authorized personnel only. Access is logged.
        </p>
      </div>
    </div>
  );
}
