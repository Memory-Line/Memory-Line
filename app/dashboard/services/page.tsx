import { MapPin, Globe2 } from "lucide-react";
import { SERVICES } from "@/lib/data";

export default function ServicesPage() {
  return (
    <div>
      <h1 className="font-serif text-[26px]">Professional Services</h1>
      <p className="text-clay text-[13px] mt-0.5 mb-5">
        Connect with activity coordinators, therapists, and engagement specialists in the care sector
      </p>

      <div className="grid grid-cols-2 gap-4">
        {SERVICES.map((s) => (
          <div key={s.name} className="rounded-xl p-4 bg-card border border-line">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[15px] font-bold">{s.name}</p>
                <p className="text-xs font-semibold text-sageDeep">{s.tag}</p>
              </div>
              {s.vip && (
                <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-cardTint">VIP</span>
              )}
            </div>
            <p className="text-[13px] text-inkSoft mt-2">{s.desc}</p>
            <div className="border-t border-line my-2.5" />
            <div className="flex items-center gap-4 text-[11px] text-clay">
              <span className="flex items-center gap-1"><MapPin size={11} /> {s.location}</span>
              <span className="flex items-center gap-1"><Globe2 size={11} /> {s.lang}</span>
            </div>
            <button className="mt-3 rounded-lg px-4 py-1.5 text-xs font-semibold bg-cardTint hover:bg-line transition-colors">
              Get in touch
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
