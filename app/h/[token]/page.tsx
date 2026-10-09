import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OWNER_SELECT, ownerIsPremium } from "@/lib/ownerAccess";
import PdfViewer from "@/app/f/[token]/PdfViewer";

export const dynamic = "force-dynamic";

// Kept out of search engines: reached from the link or QR code the home shares.
export const metadata = { title: "Shared files | Activity Central", robots: { index: false, follow: false } };

const downloadStyle = {
  border: "1px solid #B5714A",
  color: "#B5714A",
  fontWeight: 700,
  fontSize: 13.5,
  padding: "8px 16px",
  borderRadius: 10,
  textDecoration: "none",
  background: "#fff",
} as const;

// Public and read-only: a folder shown as a row of tabs, one for each link in it.
// The random token in the address is the only key.
export default async function SharedFolderPage({ params, searchParams }: { params: { token: string }; searchParams: { tab?: string } }) {
  const folder = await prisma.sharedFolder.findUnique({
    where: { token: params.token },
    include: {
      user: { select: OWNER_SELECT },
      files: { orderBy: { createdAt: "asc" }, include: { items: { orderBy: { position: "asc" } } } },
    },
  });
  // Shared files is a Premium feature: the page stops working if the owner is not on it.
  if (!folder || !ownerIsPremium(folder.user)) notFound();
  const tabs = folder.files.filter((f) => f.items.length > 0);
  if (tabs.length === 0) notFound();

  const current = tabs.find((t) => t.id === searchParams.tab) ?? tabs[0];
  const homeName = folder.user.accountType === "care-home" ? folder.user.name : null;
  const base = `/api/f/${current.token}/file`;
  const many = current.items.length > 1;

  return (
    <main style={{ background: "#F5F0E4", minHeight: "100vh", padding: "20px 14px 40px", color: "#3F3237" }}>
      <div style={{ maxWidth: 940, margin: "0 auto" }}>
        <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#3F3237" }}>
            <Image src="/activity-central-icon.png" alt="" width={40} height={40} />
            <span style={{ fontFamily: "Georgia, serif", fontSize: 17 }}>Activity Central</span>
          </Link>
          {homeName && <span style={{ fontFamily: "Georgia, serif", fontSize: 16 }}>{homeName}</span>}
        </header>

        <div style={{ background: "#fff", border: "1px solid #EAE4D6", borderRadius: 16, padding: "18px 14px 8px" }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 400, margin: "0 6px 12px" }}>{folder.name}</h1>

          <nav aria-label="Choose what to view" style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "0 6px 16px" }}>
            {tabs.map((t) => {
              const active = t.id === current.id;
              return (
                <Link
                  key={t.id}
                  href={`/h/${folder.token}?tab=${t.id}`}
                  aria-current={active ? "page" : undefined}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 999,
                    fontWeight: 700,
                    fontSize: 15,
                    textDecoration: "none",
                    background: active ? "#B5714A" : "#FBF9F4",
                    color: active ? "#fff" : "#3F3237",
                    border: `1px solid ${active ? "#B5714A" : "#EAE4D6"}`,
                  }}
                >
                  {t.title}
                </Link>
              );
            })}
          </nav>

          {current.items.map((item, i) => {
            const src = `${base}?item=${item.id}`;
            return (
              <section key={item.id} style={{ marginBottom: 18 }}>
                {(many || current.allowDownload) && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, margin: "0 6px 8px" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#8A7A6B" }}>{many ? `${i + 1} of ${current.items.length}` : ""}</span>
                    {current.allowDownload && (
                      <a href={`${src}&download=1`} style={downloadStyle}>
                        Download{many ? ` ${i + 1}` : ""}
                      </a>
                    )}
                  </div>
                )}
                {item.contentType === "application/pdf" ? (
                  <PdfViewer url={src} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={many ? `${current.title}, ${i + 1} of ${current.items.length}` : current.title} style={{ display: "block", width: "100%", height: "auto", borderRadius: 8 }} />
                )}
              </section>
            );
          })}
        </div>

        <div style={{ background: "#fff", border: "1px solid #EAE4D6", borderRadius: 16, padding: "18px 18px 20px", textAlign: "center", marginTop: 16 }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 20, margin: "0 0 4px" }}>Activities for care homes, ready to print</p>
          <p style={{ fontSize: 14, color: "#6B5F57", margin: "0 0 14px" }}>
            Activity Central has thousands of activities for care home teams. Try some free, no account or card needed.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            <Link href="/#samples" style={{ background: "#B5714A", color: "#fff", fontWeight: 700, fontSize: 14, padding: "10px 18px", borderRadius: 10, textDecoration: "none" }}>
              Try the free samples
            </Link>
            <Link href="/pricing" style={{ border: "1px solid #B5714A", color: "#B5714A", fontWeight: 700, fontSize: 14, padding: "10px 18px", borderRadius: 10, textDecoration: "none", background: "#fff" }}>
              See plans
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
