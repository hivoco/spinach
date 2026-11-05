import { apiHandler, readJson } from "@/lib/apiHandler";
import combinationServices from "@/server/services/combination";

export const POST = apiHandler(async (request) => {
  const result = await combinationServices.createCombination(await readJson(request));
  return Response.json(result);
});
