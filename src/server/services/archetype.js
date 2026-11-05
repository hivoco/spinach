import { StatusCodes } from "http-status-codes";
import { query, queryOne } from "@/lib/db";
import { assertOrThrow } from "@/lib/apiHandler";
import { newObjectId } from "@/lib/objectId";

/** Rows go back out with `_id` so existing API consumers keep working. */
const toDoc = (row) =>
  row && {
    _id: row.id,
    title: row.title,
    description: row.description,
    image: row.image,
    color: row.color,
    isLeft: Boolean(row.isLeft),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };

const createArchetype = async (data) => {
  assertOrThrow(data?.title, StatusCodes.NOT_FOUND, "Title is not Present");

  const id = newObjectId();
  const now = new Date();

  await query(
    `INSERT INTO archetypes (id, title, description, image, color, isLeft, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.title?.trim() ?? null,
      data.description?.trim() ?? null,
      data.image?.trim() ?? null,
      data.color?.trim() ?? null,
      data.isLeft ? 1 : 0,
      now,
      now,
    ]
  );

  return getArchetypeById(id);
};

const getArchetypeById = async (id) =>
  toDoc(await queryOne(`SELECT * FROM archetypes WHERE id = ?`, [id]));

const getArchetype = async () => {
  const rows = await query(`SELECT * FROM archetypes ORDER BY createdAt, id`);
  return rows.map(toDoc);
};

const updateIsLeft = async (id) => {
  const existing = await queryOne(`SELECT id FROM archetypes WHERE id = ?`, [id]);
  if (!existing) return null;

  await query(`UPDATE archetypes SET isLeft = 1, updatedAt = ? WHERE id = ?`, [
    new Date(),
    id,
  ]);

  return getArchetypeById(id);
};

const archetypeServices = {
  createArchetype,
  getArchetype,
  getArchetypeById,
  updateIsLeft,
};

export default archetypeServices;
