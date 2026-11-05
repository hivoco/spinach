import { connection } from "next/server";
import { apiHandler } from "@/lib/apiHandler";
import quizServices from "@/server/services/quiz";

const handler = apiHandler(async () => {
  const result = await quizServices.getQuestion();
  return Response.json(result);
});

export async function GET(request, context) {
  // Reads the database, so it must run per request rather than be prerendered at build time. Outside the
  // handler's try/catch: during the build this rejects on purpose, and Next needs to see that.
  await connection();
  return handler(request, context);
}
