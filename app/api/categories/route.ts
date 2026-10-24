import { NextResponse } from "next/server";
import { getCategories } from "@/lib/categories";
import { PREMIUM_ONLY_CATEGORIES } from "@/lib/plans";
import { withErrors } from "@/lib/apiHandler";

export const dynamic = "force-dynamic";

// Public: the names of the categories on the site (for the pricing page).
async function GET_() {
  const categories = await getCategories();
  return NextResponse.json({
    categories: categories.map((c) => c.key),
    premiumOnly: categories.map((c) => c.key).filter((k) => PREMIUM_ONLY_CATEGORIES.has(k)),
  });
}

export const GET = withErrors(GET_, "api/categories:GET");
