"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Flower2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", { email, password, redirect: false });

    setLoading(false);

    if (result?.error) {
      setError("Incorrect email or password.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <Flower2 size={22} className="text-sageDeep" />
          <span className="font-serif text-xl">Memory-Line</span>
        </Link>

        <div className="rounded-2xl border border-line bg-card p-7">
          <h1 className="font-serif text-2xl mb-1">Welcome back</h1>
          <p className="text-inkSoft text-sm mb-6">Log in to your Memory-Line account.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-inkSoft mb-1">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sage"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-inkSoft mb-1">Password</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sage"
              />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-sage text-white py-2.5 font-semibold text-sm hover:bg-sageDeep transition-colors disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="text-xs text-inkSoft text-center mt-5">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-sageDeep font-semibold">Sign up</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
