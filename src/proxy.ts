import { NextResponse, type NextRequest } from "next/server";
import { parsePairSlug } from "@/lib/quiz";

// Result pages are streamed, so a notFound() inside the page can't change an already-sent 200 status on a
// first visit. Reject unknown pairs here instead, so bad links get a real 404 (status, title and page).
export function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split("/")[2] ?? "";
  let decoded = "";
  try {
    decoded = decodeURIComponent(slug);
  } catch {} // malformed %-escape (e.g. /result/%E0%A4%A): treat as an unknown pair
  if (!parsePairSlug(decoded)) {
    return NextResponse.rewrite(new URL("/_unknown-result", request.url));
  }
}

export const config = {
  matcher: "/result/:path*",
};
