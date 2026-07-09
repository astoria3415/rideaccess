"use client";

import { useState } from "react";
import Link from "next/link";
import { Accessibility, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-surface px-4 py-16">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-8 w-8 text-success" aria-hidden />
            </div>
            <h1 className="mt-4 text-2xl font-bold">Check Your Email</h1>
            <p className="mt-2 text-slate-600">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </div>

          <div className="card space-y-4">
            <p className="text-sm text-slate-600">
              Click the link in the email to reset your password. The link expires in 24 hours.
            </p>
            <p className="text-sm text-slate-500">
              Didn't receive an email? Check your spam folder or{" "}
              <button
                onClick={() => {
                  setSubmitted(false);
                  setEmail("");
                }}
                className="text-primary hover:underline"
              >
                try again
              </button>
              .
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link href="/admin/login" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" aria-hidden /> Back to Sign In
            </Link>
          </div>
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
          <h1 className="mt-4 text-2xl font-bold">Forgot Password?</h1>
          <p className="text-sm text-slate-500">Enter your email to reset it</p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-5">
          <div>
            <label className="label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
              autoComplete="email"
              placeholder="admin@rideaccessnyc.com"
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
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Sending…
              </>
            ) : (
              <>Send Reset Link</>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/admin/login" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
