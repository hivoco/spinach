import { StatusCodes } from "http-status-codes";
import { query, queryOne, withTransaction } from "@/lib/db";
import { assertOrThrow } from "@/lib/apiHandler";
import { newObjectId } from "@/lib/objectId";

const S3_PDF_BASE = "https://careerarchetypes.s3.ap-south-1.amazonaws.com/pdf";

/** Same encoding the old upload route applied before building the S3 URL. */
const customEncode = (input) =>
  input.replace(/\+/g, "%2B").replace(/ /g, "%20");

/** The ordered archetype list, as stored in the `archetype_key` column. */
export const archetypeKey = (archetypeIds) => archetypeIds.join(",");

const createPdf = async (data) => {
  assertOrThrow(data?.title, StatusCodes.BAD_REQUEST, "Missing required fields");
  assertOrThrow(
    Array.isArray(data.archetypes) && data.archetypes.length > 0,
    StatusCodes.BAD_REQUEST,
    "Missing required fields"
  );

  const id = newObjectId();
  const now = new Date();
  const pdfUrl = `${S3_PDF_BASE}/${customEncode(data.title)}`;

  await withTransaction(async (conn) => {
    await conn.query(
      `INSERT INTO pdfs (id, title, pdfUrl, description, archetype_key, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.title.trim(),
        pdfUrl,
        data.description?.trim() ?? null,
        archetypeKey(data.archetypes),
        now,
        now,
      ]
    );

    for (const [position, archetypeId] of data.archetypes.entries()) {
      await conn.query(
        `INSERT INTO pdf_archetypes (pdf_id, archetype_id, position) VALUES (?, ?, ?)`,
        [id, archetypeId, position]
      );
    }
  });

  return { title: data.title, pdfUrl, archetypes: data.archetypes };
};

const SELECT_BY_KEY =
  `SELECT id, title, pdfUrl FROM pdfs WHERE archetype_key = ? ORDER BY createdAt, id LIMIT 1`;

/**
 * The old lookup was `findOne({ archetypes: { $eq: finalArchetypes } })`, which
 * matched the array *exactly and in order* — `archetype_key` preserves that.
 *
 * The library only holds one order for some pairs, though, so an exact-order
 * match alone returns nothing for e.g. [Harmoniser, Protagonist] even though
 * "Protagonist + Harmoniser.pdf" exists. A null pdf means the report link is
 * dead and the email fails outright, so the reversed order is tried as a
 * fallback. Exact order still wins when both exist.
 */
const findByArchetypes = async (archetypeIds) => {
  let row = await queryOne(SELECT_BY_KEY, [archetypeKey(archetypeIds)]);

  if (!row && archetypeIds.length > 1) {
    row = await queryOne(SELECT_BY_KEY, [archetypeKey([...archetypeIds].reverse())]);
  }

  return row ? { _id: row.id, title: row.title, pdfUrl: row.pdfUrl } : null;
};

const pdfServices = { createPdf, findByArchetypes };
export default pdfServices;
