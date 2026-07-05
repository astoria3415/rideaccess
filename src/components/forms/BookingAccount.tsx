"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, UserRound, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { site } from "@/lib/site";

export interface AccountUser {
  id: string;
  email: string;
}

/**
 * Sign-in / create-account / continue-as-guest gate shown above the
 * booking form. Reuses Supabase email/password auth (same as admin).
 * Reports the signed-in user up so the form can prefill and link the
 * booking to their account. Guests skip auth entirely.
 */
export function BookingAccount({
  user,
  onUser,
}: {
  user: AccountUser | null;
  onUser: (u: AccountUser | null) => void;
}) {
  const supabase = createClient();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [guest, setGuest] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  // Restore an existing session on mount.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        onUser({ id: data.user.id, email: data.user.email });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    if (mode === "signin") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else if (data.user?.email) {
        onUser({ id: data.user.id, email: data.user.email });
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        // Always send confirmation links to the live domain — never
        // localhost — so the link works on any device the customer opens
        // their email on. In local dev this points at production, which is
        // the correct behaviour for real customer emails.
        options: { emailRedirectTo: `${site.url}/book` },
      });
      if (error) {
        setError(
          /rate limit/i.test(error.message)
            ? "Too many sign-up emails were sent in a short time. You can continue as a guest below — your booking will still go through."
            : error.message,
        );
      } else if (data.session && data.user?.email) {
        // Email confirmation disabled — user is signed in immediately.
        onUser({ id: data.user.id, email: data.user.email });
      } else {
        setNotice("Check your email to confirm your account, then sign in.");
        setMode("signin");
      }
    }
    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    onUser(null);
    setGuest(false);
  }

  // Signed in — show status.
  if (user) {
    return (
      <div className="mb-5 flex items-center justify-between rounded-2xl border border-primary-100 bg-primary-50/60 px-5 py-3">
        <span className="flex items-center gap-2 text-sm text-slate-700">
          <UserRound className="h-4 w-4 text-primary" aria-hidden />
          Signed in as <strong>{user.email}</strong>
        </span>
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary"
        >
          <LogOut className="h-4 w-4" aria-hidden /> Sign out
        </button>
      </div>
    );
  }

  // Guest — collapsed hint with option to sign in.
  if (guest) {
    return (
      <div className="mb-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-600">
        Booking as a guest
        <button
          type="button"
          onClick={() => setGuest(false)}
          className="font-medium text-primary hover:underline"
        >
          Sign in instead
        </button>
      </div>
    );
  }

  // Auth panel.
  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
            mode === "signin"
              ? "bg-primary text-white"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
            mode === "signup"
              ? "bg-primary text-white"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          Create Account
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field"
          placeholder="Email"
          autoComplete="email"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field"
          placeholder="Password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
        />

        {error && (
          <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" aria-hidden /> {error}
          </p>
        )}
        {notice && (
          <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            {notice}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Please wait…
            </>
          ) : mode === "signin" ? (
            "Sign In"
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setGuest(true)}
        className="mt-3 w-full text-center text-sm font-medium text-slate-500 hover:text-primary"
      >
        Continue as guest
      </button>
    </div>
  );
}
