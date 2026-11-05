import { StatusCodes } from "http-status-codes";
import { query, queryOne, withTransaction } from "@/lib/db";
import { assertOrThrow } from "@/lib/apiHandler";
import { newObjectId } from "@/lib/objectId";

const getClusterById = async (id) => {
  const row = await queryOne(`SELECT * FROM clusters WHERE id = ?`, [id]);
  if (!row) return null;

  const links = await query(
    `SELECT archetype_id FROM cluster_archetypes WHERE cluster_id = ? ORDER BY position`,
    [id]
  );

  return {
    _id: row.id,
    title: row.title,
    description: row.description,
    archetype: links.map((l) => l.archetype_id),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

const createCluster = async (data) => {
  assertOrThrow(data?.title, StatusCodes.NOT_FOUND, "Title is not Present");

  const id = newObjectId();
  const now = new Date();
  const archetypes = Array.isArray(data.archetype) ? data.archetype : [];

  await withTransaction(async (conn) => {
    await conn.query(
      `INSERT INTO clusters (id, title, description, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?)`,
      [id, data.title?.trim() ?? null, data.description?.trim() ?? null, now, now]
    );

    for (const [position, archetypeId] of archetypes.entries()) {
      await conn.query(
        `INSERT INTO cluster_archetypes (cluster_id, archetype_id, position) VALUES (?, ?, ?)`,
        [id, archetypeId, position]
      );
    }
  });

  return getClusterById(id);
};

/**
 * The old code used `ClusterModel.findOne({ archetype: { $in: [id] } })` —
 * the first cluster that lists this archetype.
 */
const findClusterIdByArchetype = async (archetypeId) => {
  const row = await queryOne(
    `SELECT c.id
       FROM clusters c
       JOIN cluster_archetypes ca ON ca.cluster_id = c.id
      WHERE ca.archetype_id = ?
      ORDER BY c.createdAt, c.id
      LIMIT 1`,
    [archetypeId]
  );
  return row ? row.id : null;
};

const clusterServices = { createCluster, getClusterById, findClusterIdByArchetype };
export default clusterServices;
