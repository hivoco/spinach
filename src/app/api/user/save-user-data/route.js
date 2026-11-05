import { apiHandler, readJson } from "@/lib/apiHandler";
import userServices from "@/server/services/user";

export const POST = apiHandler(async (request) => {
  const result = await userServices.saveUserData(await readJson(request));
  return Response.json(result);
});
