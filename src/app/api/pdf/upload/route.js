import { apiHandler, readJson } from "@/lib/apiHandler";
import pdfServices from "@/server/services/pdf";

export const POST = apiHandler(async (request) => {
  const { title, archetypes } = await readJson(request);

  if (!title || !archetypes) {
    return Response.json({ message: "Missing required fields" }, { status: 400 });
  }

  const data = await pdfServices.createPdf({ title, archetypes });

  return Response.json({ message: "PDF uploaded successfully", data }, { status: 201 });
});
