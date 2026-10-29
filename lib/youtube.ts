// The YouTube video's id from a watch or short link, or null if it isn't a YouTube link.
export function youTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}
