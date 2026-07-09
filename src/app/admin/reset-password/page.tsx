"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Accessibility, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get("code");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  // Recovery links arrive either as a PKCE `?code=` param (which must be
  // exchanged for a session) or as a token hash in the URL fragment that the
  // client auto-detects. Establish the session before allowing a reset.
  useEffect(() => {
    const supabase = createClient();

    async function establishSession() {
      // Already have a recovery session (fragment auto-detected)?
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setReady(true);
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError("This reset link is invalid or has expired. Request a new one.");
          return;
        }
        setReady(true);
        return;
      }

      setError("No reset code provided. Check your email link.");
    }

    establishSession();
  }, [code]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/admin/login");
    }, 2000);
  }

  if (success) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-surface px-4 py-16">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-8 w-8 text-success" aria-hidden />
            </div>
            <h1 className="mt-4 text-2xl font-bold">Password Reset</h1>
            <p className="mt-2 text-slate-600">Your password has been successfully updated.</p>
          </div>
          <p className="text-center text-sm text-slate-500">
            Redirecting to sign in…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-surface px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white">
            <Accessibility className="h-8 w-8" aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-bold">Create New Password</h1>
          <p className="text-sm text-slate-500">Ride Access NYC Admin Dashboard</p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-5">
          <div>
            <label className="label" htmlFor="password">
              New Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label className="label" htmlFor="confirm-password">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="field"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-5 w-5" aria-hidden /> {error}
            </p>
          )}

          <button type="submit" disabled={loading || !ready} className="btn-primary w-full">
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Resetting…
              </>
            ) : (
              <>Reset Password</>
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          This link expires in 24 hours.
        </p>
      </div>
    </div>
  );
}
