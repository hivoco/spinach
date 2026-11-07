import { connection } from "next/server";
import { apiHandler } from "@/lib/apiHandler";
import { archetypes, parsePairSlug } from "@/lib/quiz";
import quizServices from "@/server/services/quiz";

const handler = apiHandler(async (request) => {
  const blend = parsePairSlug(request.nextUrl.searchParams.get("pair") ?? "");

  if (!blend) {
    return Response.json({ message: "Unknown result" }, { status: 400 });
  }

  const titles = blend.map((key) => `the ${archetypes[key].name}`);
  const result = await quizServices.getResultForTitles(titles);
  return Response.json(result);
});

export async function GET(request, context) {
  // Reads the database, so it must run per request rather than be prerendered at build time. Outside the
  // handler's try/catch: during the build this rejects on purpose, and Next needs to see that.
  await connection();
  return handler(request, context);
}
