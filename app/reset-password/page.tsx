import Link from "next/link";
import Image from "next/image";
import ResetPasswordForm from "./ResetPasswordForm";

export default function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token ?? "";
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <Image src="/activity-central-icon.png" alt="Activity Central" width={60} height={60} />
          <span className="font-serif text-xl">Activity Central</span>
        </Link>
        <div className="rounded-2xl border border-line bg-card p-7">
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <>
              <h1 className="font-serif text-2xl mb-2">This link isn't complete</h1>
              <p className="text-inkSoft text-sm mb-4">
                Open the link from your email again, or ask for a new one.
              </p>
              <Link href="/forgot-password" className="text-sm font-semibold text-sageDeep">
                Send me a new link
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
