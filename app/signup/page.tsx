"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import Image from "next/image";

export default function SignupPage() {
  const router = useRouter();
  // A care home account is named after the home, not a person.
  const [accountType, setAccountType] = useState<"care-home" | "personal">("care-home");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, accountType }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (signInResult?.error) {
      setError("Account created — please log in.");
      router.push("/login");
      return;
    }

    router.push("/pricing");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <Image src="/activity-central-icon.png" alt="Activity Central" width={60} height={60} />
          <span className="font-serif text-xl">Activity Central</span>
        </Link>

        <div className="rounded-2xl border border-line bg-card p-7">
          <h1 className="font-serif text-2xl mb-1">Create your account</h1>
          <p className="text-inkSoft text-sm mb-6">Start your free trial — no card needed yet.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="block text-xs font-semibold text-inkSoft mb-1">This account is for</p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["care-home", "A care home"],
                    ["personal", "Personal use"],
                  ] as const
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer ${
                      accountType === value ? "border-sage bg-cardTint font-semibold" : "border-line"
                    }`}
                  >
                    <input
                      type="radio"
                      name="accountType"
                      value={value}
                      checked={accountType === value}
                      onChange={() => setAccountType(value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-inkSoft mb-1">
                {accountType === "care-home" ? "Care home name" : "Your name"}
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sage"
                placeholder={accountType === "care-home" ? "Westcliff Lodge" : "Priya Sharma"}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-inkSoft mb-1">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sage"
                placeholder={accountType === "care-home" ? "manager@carehome.co.uk" : "you@example.co.uk"}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-inkSoft mb-1">Password</label>
              <input
                required
                type="password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-sage"
                placeholder="At least 8 characters"
              />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-sage text-white py-2.5 font-semibold text-sm hover:bg-sageDeep transition-colors disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-xs text-inkSoft text-center mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-sageDeep font-semibold">Log in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
