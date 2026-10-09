import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getFormByToken } from "@/lib/formsDb";
import FormFiller from "./FormFiller";

export const dynamic = "force-dynamic";

// Kept out of search engines: it's reached from the link the home shares.
export const metadata = { title: "Questionnaire", robots: { index: false, follow: false } };

// Public. The random token in the address is the only key.
export default async function QuestionnairePage({ params }: { params: { token: string } }) {
  const form = await getFormByToken(params.token);
  if (!form) notFound();

  return (
    <main style={{ background: "#F5F0E4", minHeight: "100vh", padding: "20px 14px 40px", color: "#3F3237" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#3F3237" }}>
            <Image src="/activity-central-icon.png" alt="" width={36} height={36} />
            <span style={{ fontFamily: "Georgia, serif", fontSize: 16 }}>Activity Central</span>
          </Link>
          {form.homeName && <span style={{ fontFamily: "Georgia, serif", fontSize: 17 }}>{form.homeName}</span>}
        </header>

        <div style={{ background: "#fff", border: "1px solid #EAE4D6", borderRadius: 16, padding: "22px 18px 24px" }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 400, margin: "0 0 10px" }}>{form.title}</h1>
          {form.intro && <p style={{ fontSize: 16, lineHeight: 1.6, whiteSpace: "pre-line", margin: "0 0 18px", color: "#4F443C" }}>{form.intro}</p>}
          <FormFiller token={form.token} items={form.items} thanks={form.thanks} homeName={form.homeName} />
        </div>

        <p style={{ fontSize: 12, color: "#8A7A6B", textAlign: "center", margin: "14px 0 0" }}>
          Made with Activity Central
        </p>
      </div>
    </main>
  );
}
