import { Download } from "lucide-react";
import type { Template } from "@prisma/client";

// Rows of uploaded activities with their Standard / Large Print / Answers
// / YouTube links. Shared by the regular category pages and the calendar
// occasion pages.
export default function TemplateList({ templates }: { templates: Template[] }) {
  return (
    <div className="space-y-3">
      {templates.map((t) => (
        <div key={t.id} className="flex items-center justify-between rounded-xl p-4 bg-card border border-line">
          <div>
            <p className="text-[15px] font-bold">{t.title}</p>
            <p className="text-[11px] text-inkSoft mt-0.5">{t.fileName}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <a href={t.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "#E4EEE2", color: "#6D8C6A" }}>
              <Download size={14} />
              Standard
            </a>
            {t.largePrintFileUrl && (
              <a href={t.largePrintFileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "#FCEFE7", color: "#B5714A" }}>
                Large Print
              </a>
            )}
            {t.answerFileUrl && (
              <a href={t.answerFileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "#E7ECFA", color: "#4C5FA8" }}>
                Answers
              </a>
            )}
            {t.videoUrl && (
              <a href={t.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "#F3DAD8", color: "#B5453D" }}>
                Watch on YouTube
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
