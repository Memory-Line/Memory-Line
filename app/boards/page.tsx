import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { BOARDS } from "@/lib/boards";

export const dynamic = "force-dynamic";
export const metadata = { title: "Communication boards", robots: { index: false, follow: false } };

// Pilot: only the admin can see these until they are approved.
export default async function BoardsIndex() {
  if (!(await requireAdmin())) notFound();
  return (
    <main style={{ background: "#F5F0E4", minHeight: "100vh", padding: "24px 14px 40px", color: "#2E2B24" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <p style={{ font: "700 12px Arial", letterSpacing: 1, color: "#B08968" }}>PILOT · ONLY YOU CAN SEE THIS</p>
        <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 32, margin: "4px 0 16px" }}>Communication boards: Eating and drinking</h1>
        <div style={{ display: "grid", gap: 10 }}>
          {BOARDS.map((b) => (
            <Link key={b.id} href={`/boards/${b.id}`} style={{ background: "#fff", border: "2px solid #E6DDC8", borderRadius: 16, padding: "14px 18px", textDecoration: "none", color: "inherit" }}>
              <span style={{ font: "700 12px Arial", color: "#B08968" }}>{b.code}</span>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 22 }}>{b.question.en}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
