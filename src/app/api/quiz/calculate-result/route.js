import { apiHandler, readJson } from "@/lib/apiHandler";
import quizServices from "@/server/services/quiz";

export const POST = apiHandler(async (request) => {
  const result = await quizServices.calculateResult(await readJson(request));
  return Response.json(result);
});
