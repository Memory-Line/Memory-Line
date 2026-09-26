import sheets from "@/lib/data/spotDifference.json";

// Where Picture A and Picture B sit on the sheet's Standard PDF page (as a
// fraction of the page), and the 7 places they differ (as a fraction of the
// picture itself — the same box works on both pictures). Worked out by
// scripts/spotdifference/extract_spotdifference.py, since there are no
// answer sheets for this pack; a sheet whose differences couldn't be found
// cleanly is left out (its entry is null). Entry n is the sheet whose file
// name starts with n.
export type PictureRect = { x: number; y: number; w: number; h: number };
export type DifferenceRegion = { x: number; y: number; w: number; h: number };
export type SpotDifferenceSheet = {
  n: number;
  pictureA: PictureRect;
  pictureB: PictureRect;
  regions: DifferenceRegion[];
};

export function spotDifference(n: number): SpotDifferenceSheet | null {
  const entry = (sheets as (SpotDifferenceSheet | null)[])[n - 1];
  return entry && entry.n === n ? entry : null;
}
