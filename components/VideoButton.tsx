import Link from "next/link";
import { Play } from "lucide-react";
import { youTubeId } from "@/lib/youtube";

// "Play video": opens the activity's YouTube video on a large page of its own (app/dashboard/watch/[id]).
// Any other kind of link (a sign video) still opens in a new tab.
export default function VideoButton({ id, url, className, style }: { id: string; url: string; className?: string; style?: React.CSSProperties }) {
  if (!youTubeId(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={className} style={style}>
        <Play size={14} /> Watch sign video
      </a>
    );
  }
  return (
    <Link href={`/dashboard/watch/${id}`} prefetch={false} className={className} style={style}>
      <Play size={14} /> Play video
    </Link>
  );
}
