"use client";

import { useEffect, useRef, useState } from "react";

// Plays one SignBSL.com sign video using their own embed code (a blockquote plus their script), so the video
// is served by SignBSL and credited to them. If there are several signers, buttons switch between them.
export default function SignEmbed({ slug, title, videos }: { slug: string; title: string; videos: string[] }) {
  const [i, setI] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const vid = videos[Math.min(i, videos.length - 1)];

  useEffect(() => {
    const el = box.current;
    if (!el || !vid) return;
    el.innerHTML = "";
    const bq = document.createElement("blockquote");
    bq.className = "signbsldata-embed";
    bq.setAttribute("data-vidref", vid);
    const a = document.createElement("a");
    a.href = `https://www.signbsl.com/sign/${slug}`;
    a.textContent = `Watch how to sign '${title}' in British Sign Language`;
    bq.appendChild(a);
    el.appendChild(bq);
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://embed.signbsl.com/widgets.js";
    s.charset = "utf-8";
    el.appendChild(s);
    return () => {
      el.innerHTML = "";
    };
  }, [vid, slug, title]);

  if (!vid) return <p className="text-sm text-inkSoft">The video for this sign is not available yet.</p>;

  return (
    <div>
      <div ref={box} className="min-h-[260px] [&_div]:max-w-full" />
      {videos.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 mt-2" role="group" aria-label="Choose a signer">
          <span className="text-xs font-semibold text-inkSoft mr-1">Another signer:</span>
          {videos.map((_, k) => (
            <button
              key={k}
              type="button"
              onClick={() => setI(k)}
              aria-pressed={k === i}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold border-2 ${k === i ? "bg-sage text-white border-sage" : "bg-white text-sageDeep border-line"}`}
            >
              {k + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
