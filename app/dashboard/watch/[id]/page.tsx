import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { displayTitle } from "@/lib/titles";
import { youTubeId } from "@/lib/youtube";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";

// An activity's video on a page of its own, as large as the screen allows.
export default async function WatchPage({ params }: { params: { id: string } }) {
  const t = await prisma.template.findUnique({ where: { id: params.id }, select: { title: true, fileName: true, videoUrl: true } });
  if (!t || !t.videoUrl) notFound();
  const id = youTubeId(t.videoUrl);
  if (!id) redirect(t.videoUrl);
  const title = displayTitle(t);

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h1 className="font-serif text-2xl sm:text-3xl">{title}</h1>
        <BackButton />
      </div>
      <div className="relative w-full overflow-hidden rounded-2xl bg-black shadow-lg" style={{ aspectRatio: "16 / 9", maxHeight: "calc(100vh - 160px)" }}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    </div>
  );
}
