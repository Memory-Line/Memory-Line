import { getViewer } from "@/lib/viewer";
import PrintBar from "@/components/PrintBar";

// Every BSL Tools page shares the print bar (Premium accounts only; it appears once a card is ticked).
export default async function BslToolsLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  return (
    <>
      {children}
      {viewer.isPremium && <PrintBar />}
    </>
  );
}
