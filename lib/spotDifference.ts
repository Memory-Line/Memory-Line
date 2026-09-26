import sheets from "@/lib/data/spotDifference.json";

// Where Picture A and Picture B sit on the sheet's Standard PDF page (as a
// fraction of the page). Worked out by
// scripts/spotdifference/extract_pictures_only.py. There's no answer key for
// this pack, so the online game doesn't try to guess the 7 differences —
// people circle what they spot themselves. A sheet whose two pictures
// couldn't be found cleanly is left out (its entry is null). Entry n is the
// sheet whose file name starts with n.
export type PictureRect = { x: number; y: number; w: number; h: number };
export type SpotDifferenceSheet = {
  n: number;
  pictureA: PictureRect;
  pictureB: PictureRect;
};

export function spotDifference(n: number): SpotDifferenceSheet | null {
  const entry = (sheets as (SpotDifferenceSheet | null)[])[n - 1];
  return entry && entry.n === n ? entry : null;
}
