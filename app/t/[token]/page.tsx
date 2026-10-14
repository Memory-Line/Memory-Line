import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse, publicCourse } from "@/lib/trainingCourses";
import { readToken } from "@/lib/trainingToken";
import TrainingPlayer from "@/components/TrainingPlayer";

export const dynamic = "force-dynamic";

// Kept out of search engines: the private link is the only key.
export const metadata = { title: "Training | Activity Central", robots: { index: false, follow: false } };

export default function TrainingLinkPage({ params }: { params: { token: string } }) {
  const link = readToken<{ c: string; e: string; h: string | null }>(decodeURIComponent(params.token), "link");
  const course = link ? getCourse(link.c) : null;
  if (!link || !course) notFound();

  return (
    <main style={{ background: "#F5F0E4", minHeight: "100vh", padding: "20px 14px 48px", color: "#3F3237" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: 14 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#3F3237" }}>
            <Image src="/activity-central-icon.png" alt="" width={44} height={44} />
            <span style={{ fontFamily: "Georgia, serif", fontSize: 18 }}>Activity Central</span>
          </Link>
          {link.h && <p style={{ margin: "4px 0 0", fontSize: 14, color: "#6B5F57" }}>Training for {link.h}</p>}
        </header>
        <TrainingPlayer link={decodeURIComponent(params.token)} course={publicCourse(course)} />
      </div>
    </main>
  );
}
