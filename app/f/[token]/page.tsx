import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getLinkByToken } from "@/lib/sharedFilesDb";
import PdfViewer from "./PdfViewer";

export const dynamic = "force-dynamic";

// Kept out of search engines: it's meant to be reached from the link the home
// puts on its own website, not found through Google.
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

// Public and read-only. The random token in the address is the only key.
export default async function SharedFilePage({ params, searchParams }: { params: { token: string }; searchParams: { file?: string } }) {
  const link = await getLinkByToken(params.token);
  if (!link || link.items.length === 0) notFound();

  const base = `/api/f/${link.token}/file`;
  const many = link.items.length > 1;
  // With several files the visitor first sees a menu of their names and taps the
  // one they want (?file=<id>); with one file it is shown straight away.
  const picked = many ? link.items.find((x) => x.id === searchParams.file) : undefined;
  const menu = many && !picked;
  const shown = menu ? [] : picked ? [picked] : link.items;
  // A care home is named after the home; a personal account's name stays private.
  const homeName = link.user.accountType === "care-home" ? link.user.name : null;
  const updated = link.updatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

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
          <div style={{ margin: "0 6px 14px" }}>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 400, margin: 0 }}>{link.title}</h1>
            <p style={{ fontSize: 12, color: "#8A7A6B", margin: "2px 0 0" }}>Updated {updated}</p>
          </div>

          {menu && (
            <div style={{ display: "grid", gap: 10, margin: "0 6px 14px" }}>
              <p style={{ fontSize: 14, color: "#6B5F57", margin: 0 }}>Tap what you would like to see.</p>
              {link.items.map((item, i) => (
                <Link
                  key={item.id}
                  href={`/f/${link.token}?file=${item.id}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "#FBF9F4", border: "1px solid #EAE4D6", borderRadius: 12, padding: "14px 16px", textDecoration: "none", color: "#3F3237", fontFamily: "Georgia, serif", fontSize: 19 }}
                >
                  <span>{item.name || `File ${i + 1}`}</span>
                  <span style={{ color: "#B5714A", fontFamily: "Arial, sans-serif", fontSize: 14, fontWeight: 700 }}>View →</span>
                </Link>
              ))}
            </div>
          )}

          {shown.map((item) => {
            const i = link.items.findIndex((x) => x.id === item.id);
            const label = item.name || (many ? `File ${i + 1}` : link.title);
            const src = `${base}?item=${item.id}`;
            return (
              <section key={item.id} style={{ marginBottom: 18 }}>
                {(many || link.allowDownload) && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, margin: "0 6px 8px" }}>
                    {many ? (
                      <Link href={`/f/${link.token}`} style={{ fontSize: 13.5, fontWeight: 700, color: "#B5714A", textDecoration: "none" }}>
                        ← Back to all
                      </Link>
                    ) : (
                      <span />
                    )}
                    {link.allowDownload && (
                      <a href={`${src}&download=1`} style={downloadStyle}>
                        Download
                      </a>
                    )}
                  </div>
                )}
                {many && <h2 style={{ fontFamily: "Georgia, serif", fontSize: 21, fontWeight: 400, margin: "0 6px 10px" }}>{label}</h2>}
                {item.contentType === "application/pdf" ? (
                  <PdfViewer url={src} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={label} style={{ display: "block", width: "100%", height: "auto", borderRadius: 8 }} />
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
