import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { occasionsForYear } from "@/lib/ukCalendar";
import { MONTH_NAMES, WEEKDAYS, TAB_COLORS, getMonthGrid, monthsLabel } from "@/lib/calendarShared";
import { OWNER_SELECT, ownerIsActive, ownerIsPremium } from "@/lib/ownerAccess";
import { rotaLabelFor } from "@/lib/rota";
import { loadRota } from "@/lib/rotaDb";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

// Kept out of search engines: it can show a home's own events, and it's meant
// to be reached from the link the home puts on its website.
export const metadata = { title: "Calendar | Activity Central", robots: { index: false, follow: false } };

type Item = { label: string; time: string | null };

// Public and read-only. The random token in the address is the only key.
export default async function SharedCalendarPage({ params }: { params: { token: string } }) {
  const link = await prisma.sharedCalendar.findUnique({
    where: { token: params.token },
    include: { user: { select: OWNER_SELECT } },
  });
  // The calendar tools are a Premium feature (the blank professional calendar is
  // a per-account feature, so it only needs an active account). If the owner has
  // moved to Standard or cancelled, the link stops working; it works again if
  // they upgrade.
  if (!link) notFound();
  const ownerOk = link.calendar === "professional" ? ownerIsActive(link.user) : ownerIsPremium(link.user);
  if (!ownerOk) notFound();

  const professional = link.calendar === "professional";
  const months = [...link.months].sort((a, b) => a - b);

  const custom = await prisma.calendarEvent.findMany({
    where: { userId: link.userId, year: link.year, calendar: link.calendar },
    orderBy: [{ month: "asc" }, { day: "asc" }],
  });
  const builtIn = professional ? [] : occasionsForYear(link.year);
  // The owner's weekly rota, if it's switched on, shows on the shared months too.
  const rota = await loadRota(link.userId, link.calendar);

  const itemsFor = (month: number) => {
    const byDay: Record<number, Item[]> = {};
    for (const o of builtIn) if (o.month === month) (byDay[o.day] ??= []).push({ label: o.label, time: null });
    const daysInMonth = new Date(link.year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const label = rotaLabelFor(rota, new Date(link.year, month, d));
      if (label) (byDay[d] ??= []).push({ label, time: null });
    }
    for (const e of custom) if (e.month === month) (byDay[e.day] ??= []).push({ label: e.title, time: e.time });
    return byDay;
  };

  // A care home is named after the home; a personal account's name is private.
  const homeName = link.user.accountType === "care-home" ? link.user.name : null;
  const heading = professional ? "Our calendar" : "Holidays & celebrations";

  return (
    <main style={{ background: "#F5F0E4", minHeight: "100vh", padding: "24px 16px 40px", color: "#3F3237" }}>
      <style>{`
        .sc-agenda { display: none; }
        @media (max-width: 640px) {
          .sc-grid, .sc-weekdays { display: none !important; }
          .sc-agenda { display: block; }
        }
        @page { size: A4 landscape; margin: 10mm; }
        @media print {
          main { background: #fff !important; padding: 0 !important; }
          .sc-no-print { display: none !important; }
          .sc-grid, .sc-weekdays { display: grid !important; }
          .sc-agenda { display: none !important; }
          .sc-month { break-after: page; page-break-after: always; box-shadow: none !important; border: none !important; }
          .sc-month:last-of-type { break-after: auto; page-break-after: auto; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: 18 }}>
          <Link href="/" className="sc-no-print" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#3F3237", marginBottom: 8 }}>
            <Image src="/activity-central-icon.png" alt="" width={44} height={44} />
            <span style={{ fontFamily: "Georgia, serif", fontSize: 18 }}>Activity Central</span>
          </Link>
          {homeName && <p style={{ margin: "0 0 2px", fontFamily: "Georgia, serif", fontSize: 18 }}>{homeName}</p>}
          <p style={{ margin: 0, color: "#B5714A", fontWeight: 700, fontSize: 12, letterSpacing: 1.5 }}>
            {heading.toUpperCase()}
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 34, fontWeight: 400, margin: "2px 0" }}>
            {monthsLabel(months)} {link.year}
          </h1>
          <div className="sc-no-print" style={{ marginTop: 10 }}>
            <PrintButton />
          </div>
        </header>

        {months.map((m) => {
          const byDay = itemsFor(m);
          const cells = getMonthGrid(link.year, m);
          const daysWithItems = Object.keys(byDay).map(Number).sort((a, b) => a - b);
          return (
            <section
              key={m}
              className="sc-month"
              style={{ background: "#fff", border: "1px solid #EAE4D6", borderRadius: 16, padding: "16px 14px 18px", marginBottom: 20, boxShadow: "0 1px 3px rgba(63,50,55,0.06)" }}
            >
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 400, textAlign: "center", margin: "0 0 12px" }}>
                {MONTH_NAMES[m]} {link.year}
              </h2>

              <div className="sc-weekdays" style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4, marginBottom: 4 }}>
                {WEEKDAYS.map((w, i) => (
                  <div key={w} style={{ textAlign: "center", fontWeight: 700, fontSize: 13, padding: "8px 0", background: TAB_COLORS[i].bg, color: TAB_COLORS[i].text, borderRadius: 10 }}>
                    {w}
                  </div>
                ))}
              </div>

              <div className="sc-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4 }}>
                {cells.map((day, i) => {
                  const c = TAB_COLORS[i % 7];
                  const items = day ? byDay[day] ?? [] : [];
                  return (
                    <div key={i} style={{ minHeight: 96, border: "1px solid #EAE4D6", borderRadius: 10, padding: 7, background: day ? "#fff" : "transparent", borderColor: day ? "#EAE4D6" : "transparent" }}>
                      {day && (
                        <>
                          <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.1, marginBottom: 3 }}>{day}</div>
                          {items.map((it, k) => (
                            <div key={k} style={{ background: c.bg, color: c.text, fontWeight: 700, fontSize: 10.5, lineHeight: 1.2, padding: "3px 6px", borderRadius: 6, marginBottom: 2, overflowWrap: "anywhere" }}>
                              {it.label}
                              {it.time ? ` · ${it.time}` : ""}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="sc-agenda">
                {daysWithItems.length === 0 && <p style={{ textAlign: "center", fontSize: 13, color: "#8A7A6B" }}>Nothing listed this month.</p>}
                {daysWithItems.map((day) => {
                  const weekday = (new Date(link.year, m, day).getDay() + 6) % 7;
                  const c = TAB_COLORS[weekday];
                  return (
                    <div key={day} style={{ display: "flex", gap: 10, padding: "8px 0", borderTop: "1px solid #F0EBDD" }}>
                      <div style={{ width: 54, flex: "0 0 54px", textAlign: "center" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: c.text }}>{WEEKDAYS[weekday].slice(0, 3)}</div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{day}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {byDay[day].map((it, k) => (
                          <div key={k} style={{ background: c.bg, color: c.text, fontWeight: 700, fontSize: 13, padding: "4px 8px", borderRadius: 6, marginBottom: 3, overflowWrap: "anywhere" }}>
                            {it.label}
                            {it.time ? ` · ${it.time}` : ""}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <div className="sc-no-print" style={{ background: "#fff", border: "1px solid #EAE4D6", borderRadius: 16, padding: "18px 18px 20px", textAlign: "center" }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 20, margin: "0 0 4px" }}>Activities for every one of these dates</p>
          <p style={{ fontSize: 14, color: "#6B5F57", margin: "0 0 14px" }}>
            Activity Central has thousands of ready-to-print activities for care homes. Try some free, no account or card needed.
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
