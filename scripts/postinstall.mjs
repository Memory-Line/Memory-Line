// Runs after every install on Vercel (and locally).
//
// - The database address the site uses to run is DATABASE_URL (the "pooled" address, which shares a few real
//   connections between every copy of the site). Changing the database's structure needs the direct address,
//   DIRECT_URL. If DIRECT_URL is not set yet, DATABASE_URL is used for both, as before.
// - The structure update (prisma db push) only runs for the real live build, not for the test builds made for
//   every pull request, so a burst of builds no longer opens a burst of connections to the live database.
import { spawnSync } from "node:child_process";

process.env.DIRECT_URL ||= process.env.DATABASE_URL;

function run(args) {
  const r = spawnSync("npx", ["prisma", ...args], { stdio: "inherit", shell: true, env: process.env });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run(["generate"]);

const onVercel = !!process.env.VERCEL;
if (!onVercel || process.env.VERCEL_ENV === "production") {
  run(["db", "push", "--accept-data-loss"]);
} else {
  console.log(`Skipping prisma db push for a ${process.env.VERCEL_ENV} build.`);
}
