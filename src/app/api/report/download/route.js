import { connection } from "next/server";
import { apiHandler } from "@/lib/apiHandler";

const PDF_ORIGIN = "https://careerarchetypes.s3.ap-south-1.amazonaws.com";

/** Only a PDF in the bucket's pdf/ folder, so this route can't be used to fetch anything else. */
const parseReportUrl = (value) => {
  try {
    const url = new URL(value);
    return url.origin === PDF_ORIGIN && url.pathname.startsWith("/pdf/") && url.pathname.endsWith(".pdf") ? url : null;
  } catch {
    return null;
  }
};

/**
 * Browsers ignore the `download` attribute on another site's files and S3 sends these as plain PDFs, so they open in a
 * tab. Serving the file from this site, marked as an attachment, makes the browser save it to the device instead.
 */
const handler = apiHandler(async (request) => {
  const url = parseReportUrl(request.nextUrl.searchParams.get("url"));

  if (!url) {
    return Response.json({ message: "Unknown report" }, { status: 400 });
  }

  const pdf = await fetch(url, { redirect: "error" });

  if (!pdf.ok) {
    return Response.json({ message: "Report not found" }, { status: 404 });
  }

  return new Response(pdf.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="Career-Archetype-Report.pdf"',
      ...(pdf.headers.get("content-length") ? { "Content-Length": pdf.headers.get("content-length") } : {}),
    },
  });
});

export async function GET(request, context) {
  // Must run per request rather than be prerendered at build time. Outside the handler's try/catch: during the
  // build this rejects on purpose, and Next needs to see that.
  await connection();
  return handler(request, context);
}
