import { NextResponse } from "next/server";
import { getCourse } from "@/lib/trainingCourses";
import { readToken, certificateNumber } from "@/lib/trainingToken";
import { makeCertificate } from "@/lib/certificatePdf";
import { sendEmail, siteUrl, trainingCertificateEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// After a pass: makes the certificate with the name the person typed, emails it to the manager and gives
// it back to the person to download. The name and job title are used here and not saved.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const link = readToken<{ c: string; e: string; h: string | null }>(body.link, "link");
  const pass = readToken<{ c: string; s: number; n: number }>(body.pass, "pass");
  if (!link || !pass || pass.c !== link.c) return NextResponse.json({ error: "This link is not valid" }, { status: 404 });
  const course = getCourse(link.c);
  if (!course) return NextResponse.json({ error: "Unknown course" }, { status: 404 });

  const name = String(body.name ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  const job = String(body.job ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (!name || !job) return NextResponse.json({ error: "Please fill in your name and job title." }, { status: 400 });

  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const certNo = certificateNumber(name, course.key, day);
  const pdf = await makeCertificate({
    name,
    courseTitle: course.title,
    minutes: course.minutes,
    score: pass.s,
    total: pass.n,
    completedOn: now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    homeName: link.h,
    certNo,
    logoUrl: `${siteUrl()}/activity-central-icon.png`,
  });
  const safe = name.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "certificate";
  const filename = `Certificate-${safe}.pdf`;
  const base64 = pdf.toString("base64");

  const emailed = await sendEmail(
    trainingCertificateEmail({
      to: link.e,
      staffName: name,
      jobTitle: job,
      courseTitle: course.title,
      score: pass.s,
      total: pass.n,
      homeName: link.h,
      pdf: { filename, base64 },
    })
  );
  return NextResponse.json({ emailed, filename, pdf: base64 });
}
