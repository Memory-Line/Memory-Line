import { NextResponse } from "next/server";
import { getCategories } from "@/lib/categories";
import { PREMIUM_ONLY_CATEGORIES } from "@/lib/plans";

export const dynamic = "force-dynamic";

// Public: the names of the categories on the site (for the pricing page).
export async function GET() {
  const categories = await getCategories();
  return NextResponse.json({
    categories: categories.map((c) => c.key),
    premiumOnly: categories.map((c) => c.key).filter((k) => PREMIUM_ONLY_CATEGORIES.has(k)),
  });
}
