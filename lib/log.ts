// One place errors are written down. Output goes to Vercel's runtime logs as a single line of JSON, so it
// can be searched there (Project > Logs). Never put passwords, card details or whole request bodies in `extra`.
export function logError(where: string, err: unknown, extra?: Record<string, unknown>) {
  const e = err instanceof Error ? err : new Error(String(err));
  console.error(
    JSON.stringify({
      level: "error",
      where,
      message: e.message,
      stack: e.stack?.split("\n").slice(0, 6).join(" | "),
      ...extra,
      at: new Date().toISOString(),
    })
  );
}
