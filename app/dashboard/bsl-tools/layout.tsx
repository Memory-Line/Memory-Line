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
      <p className="mt-10 border-t border-line pt-3 text-xs text-inkSoft leading-relaxed">
        Sign videos are from{" "}
        <a href="https://www.signbsl.com" target="_blank" rel="noopener noreferrer" className="underline">SignBSL.com</a>, the British Sign Language dictionary,
        and are played through their own player. Our thanks to SignBSL and to the people and organisations whose signs it shows, including the Scottish
        Sensory Centre, Deafax and the National Deaf Children&rsquo;s Society (all listed on{" "}
        <a href="https://www.signbsl.com/about" target="_blank" rel="noopener noreferrer" className="underline">SignBSL&rsquo;s About page</a>).
      </p>
      {viewer.isPremium && <PrintBar />}
    </>
  );
}
