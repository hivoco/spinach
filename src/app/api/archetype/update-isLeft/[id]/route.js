import { apiHandler } from "@/lib/apiHandler";
import archetypeServices from "@/server/services/archetype";

export const PUT = apiHandler(async (request, { params }) => {
  const result = await archetypeServices.updateIsLeft((await params).id);

  if (!result) {
    return Response.json({ message: "Document not found" }, { status: 404 });
  }

  return Response.json({ message: "Updated successfully", data: result }, { status: 200 });
});
