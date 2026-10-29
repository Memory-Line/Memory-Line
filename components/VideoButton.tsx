"use client";

import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";

// The YouTube video's id from a watch or short link, or null if it isn't a YouTube link.
function youTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}

// "Play video": plays an activity's YouTube video in a window on the page, so nobody leaves the site.
// Any other kind of link (a sign video) still opens in a new tab.
export default function VideoButton({ url, title, className, style }: { url: string; title: string; className?: string; style?: React.CSSProperties }) {
  const id = youTubeId(url);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const was = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = was;
    };
  }, [open]);

  if (!id) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={className} style={style}>
        <Play size={14} /> Watch sign video
      </a>
    );
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className} style={style}>
        <Play size={14} /> Play video
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={() => setOpen(false)}
        >
          <div className="w-full max-w-4xl rounded-2xl bg-white p-3 sm:p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="font-serif text-lg truncate">{title}</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close video" className="shrink-0 rounded-full p-2 hover:bg-black/5">
                <X size={22} />
              </button>
            </div>
            <div className="relative w-full overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "16 / 9" }}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
                title={title}
                className="absolute inset-0 h-full w-full"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
