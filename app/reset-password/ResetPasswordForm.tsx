"use client";

import { useState } from "react";
import Link from "next/link";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Those passwords don't match. Please check and try again.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <>
        <h1 className="font-serif text-2xl mb-2">Password changed</h1>
        <p className="text-inkSoft text-sm mb-5">You can now log in with your new password.</p>
        <Link
          href="/login"
          className="block w-full text-center rounded-lg bg-sage text-white py-2.5 font-semibold text-sm hover:bg-sageDeep transition-colors"
        >
          Log in
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="font-serif text-2xl mb-1">Choose a new password</h1>
      <p className="text-inkSoft text-sm mb-6">At least 8 characters.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-inkSoft mb-1">New password</label>
          <input
            id="password"
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sage"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-xs font-semibold text-inkSoft mb-1">Confirm new password</label>
          <input
            id="confirm"
            required
            type="password"
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sage"
          />
        </div>
        {error && (
          <p className="text-xs text-red-600">
            {error}{" "}
            {error.includes("expired") && (
              <Link href="/forgot-password" className="underline font-semibold">
                Get a new link
              </Link>
            )}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-sage text-white py-2.5 font-semibold text-sm hover:bg-sageDeep transition-colors disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save new password"}
        </button>
      </form>
    </>
  );
}
