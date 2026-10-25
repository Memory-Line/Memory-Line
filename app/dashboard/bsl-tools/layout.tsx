import { getViewer } from "@/lib/viewer";
import PrintBar from "@/components/PrintBar";

// Every BSL Tools page shares a short how-to line and the print bar (Premium accounts only; the bar appears once a card is ticked).
export default async function BslToolsLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  return (
    <>
      {viewer.isPremium && (
        <p className="mb-4 rounded-lg bg-cardTint px-4 py-2 text-[13px] text-inkSoft">
          <strong className="text-ink">How to print:</strong> press <strong className="text-ink">Print</strong> on each sign you want, then press{" "}
          <strong className="text-ink">Print my cards</strong> at the bottom. Cards print four to a page.
        </p>
      )}
      {children}
      {viewer.isPremium && <PrintBar />}
    </>
  );
}
