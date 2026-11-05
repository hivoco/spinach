import { apiHandler, readJson } from "@/lib/apiHandler";
import clusterServices from "@/server/services/cluster";

export const POST = apiHandler(async (request) => {
  const result = await clusterServices.createCluster(await readJson(request));
  return Response.json(result);
});
