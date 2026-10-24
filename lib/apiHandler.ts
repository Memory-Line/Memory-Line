import { NextResponse } from "next/server";
import { logError } from "@/lib/log";

// Wraps a route handler so that any failure nobody planned for is written to the log and answered with a calm
// message, instead of a blank 500 page. Handlers that already catch their own errors keep doing so.
export function withErrors<A extends unknown[]>(fn: (...args: A) => Promise<Response>, where: string) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      logError(where, err);
      return NextResponse.json({ error: "Something went wrong on our side. Please try again in a moment." }, { status: 500 });
    }
  };
}
