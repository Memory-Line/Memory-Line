import Link from "next/link";
import Image from "next/image";
import StopForm from "./StopForm";

export const metadata = { title: "Stop emails | Activity Central", robots: { index: false, follow: false } };

// The page the link in our emails to care homes goes to. The address can be filled in from the link
// (/stop?e=name@home.co.uk), but nothing happens until the button is pressed, so an email
// security scanner that opens every link can't stop anyone's emails by accident.
export default function StopPage({ searchParams }: { searchParams: { e?: string } }) {
  const prefill = typeof searchParams.e === "string" ? searchParams.e.slice(0, 200) : "";
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <Image src="/activity-central-icon.png" alt="Activity Central" width={60} height={60} />
          <span className="font-serif text-xl">Activity Central</span>
        </Link>
        <div className="rounded-2xl border border-line bg-card p-7">
          <StopForm prefill={prefill} />
        </div>
      </div>
    </main>
  );
}
