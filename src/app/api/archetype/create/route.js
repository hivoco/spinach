import { apiHandler, readJson } from "@/lib/apiHandler";
import archetypeServices from "@/server/services/archetype";

export const POST = apiHandler(async (request) => {
  const result = await archetypeServices.createArchetype(await readJson(request));
  return Response.json(result);
});
