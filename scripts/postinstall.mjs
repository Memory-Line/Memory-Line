// Runs after every install on Vercel (and locally).
//
// The database's structure update (prisma db push) only runs for the real live build, not for the test builds made
// for every pull request, so a burst of builds no longer opens a burst of connections to the live database.
import { spawnSync } from "node:child_process";

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
