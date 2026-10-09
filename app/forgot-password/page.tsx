"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/password/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }
    setSent(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <Image src="/activity-central-icon.png" alt="Activity Central" width={60} height={60} />
          <span className="font-serif text-xl">Activity Central</span>
        </Link>

        <div className="rounded-2xl border border-line bg-card p-7">
          <h1 className="font-serif text-2xl mb-1">Forgot your password?</h1>

          {sent ? (
            <>
              <p className="text-inkSoft text-sm mt-3">
                If there's an account for <b>{email}</b>, we've sent a link to choose a new password. It can take a
                couple of minutes to arrive, so check your junk folder too. The link works for 1 hour.
              </p>
              <Link href="/login" className="inline-block mt-5 text-sm font-semibold text-sageDeep">
                Back to log in
              </Link>
            </>
          ) : (
            <>
              <p className="text-inkSoft text-sm mb-6">
                Enter your email and we'll send you a link to choose a new one.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-inkSoft mb-1">Email</label>
                  <input
                    id="email"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sage"
                  />
                </div>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-sage text-white py-2.5 font-semibold text-sm hover:bg-sageDeep transition-colors disabled:opacity-60"
                >
                  {loading ? "Sending..." : "Send me a link"}
                </button>
              </form>
              <p className="text-xs text-inkSoft text-center mt-5">
                <Link href="/login" className="text-sageDeep font-semibold">Back to log in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
