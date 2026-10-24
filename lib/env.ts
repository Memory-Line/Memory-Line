import { NextResponse } from "next/server";

// Which copy of the site is running. Vercel sets VERCEL_ENV to "production" for the real site
// and "preview" for test builds. A test build (or a computer running the site locally) shares
// the same database, email key and file storage as the real site, so anything that changes
// real customer data or sends real email is switched off unless this is the real site.
export function isLiveSite() {
  return process.env.VERCEL_ENV === "production";
}

// A test build, not the real site. Used for the warning strip.
export function isTestBuild() {
  return !isLiveSite();
}

// Put at the top of a route that changes real data. Returns a ready-made "no" answer when this is
// not the real site, or null when it is fine to carry on:
//   const blocked = offLiveBlock(); if (blocked) return blocked;
export function offLiveBlock() {
  if (isLiveSite()) return null;
  return NextResponse.json(
    { error: "This is switched off on test builds, because they share the live site's data. Do it on the real site." },
    { status: 403 }
  );
}
