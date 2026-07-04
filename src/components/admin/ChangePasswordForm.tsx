"use client";

import { useState } from "react";
import { Loader2, KeyRound, Check, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setState("error");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      setState("error");
      return;
    }

    setState("saving");
    const { error: updateError } = await createClient().auth.updateUser({
      password,
    });
    if (updateError) {
      setError(updateError.message);
      setState("error");
      return;
    }
    setPassword("");
    setConfirm("");
    setState("saved");
  }

  return (
    <form onSubmit={onSubmit} className="card max-w-md space-y-4">
      <div>
        <label htmlFor="new-password" className="label">
          New password *
        </label>
        <input
          id="new-password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field"
          autoComplete="new-password"
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="label">
          Confirm new password *
        </label>
        <input
          id="confirm-password"
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="field"
          autoComplete="new-password"
        />
      </div>

      {state === "error" && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-5 w-5" aria-hidden /> {error}
        </p>
      )}
      {state === "saved" && (
        <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <Check className="h-5 w-5" aria-hidden /> Password updated. Use it
          the next time you sign in.
        </p>
      )}

      <button type="submit" disabled={state === "saving"} className="btn-primary">
        {state === "saving" ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Saving…
          </>
        ) : (
          <>
            <KeyRound className="h-5 w-5" aria-hidden /> Change Password
          </>
        )}
      </button>
    </form>
  );
}
