import { StatusCodes } from "http-status-codes";
import { query, queryOne, withTransaction } from "@/lib/db";
import { assertOrThrow } from "@/lib/apiHandler";
import { newObjectId } from "@/lib/objectId";

const getCombinationById = async (id) => {
  const row = await queryOne(`SELECT * FROM combinations WHERE id = ?`, [id]);
  if (!row) return null;

  const links = await query(
    `SELECT cluster_id FROM combination_clusters WHERE combination_id = ? ORDER BY position`,
    [id]
  );

  return {
    _id: row.id,
    title: row.title,
    description: row.description,
    clusters: links.map((l) => l.cluster_id),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

const createCombination = async (data) => {
  assertOrThrow(data?.description, StatusCodes.NOT_FOUND, "Title is not Present");

  const id = newObjectId();
  const now = new Date();
  const clusters = Array.isArray(data.clusters) ? data.clusters : [];

  await withTransaction(async (conn) => {
    // New rows sort after every migrated one, matching Mongo's append order.
    const [[{ nextOrder }]] = await conn.query(
      `SELECT COALESCE(MAX(natural_order) + 1, 0) AS nextOrder FROM combinations`
    );

    await conn.query(
      `INSERT INTO combinations (id, title, description, cluster_count, natural_order, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.title?.trim() ?? null,
        data.description?.trim() ?? null,
        clusters.length,
        nextOrder,
        now,
        now,
      ]
    );

    for (const [position, clusterId] of clusters.entries()) {
      await conn.query(
        `INSERT INTO combination_clusters (combination_id, cluster_id, position) VALUES (?, ?, ?)`,
        [id, clusterId, position]
      );
    }
  });

  return getCombinationById(id);
};

/**
 * Mongo equivalent: `findOne({ clusters: { $all: clusterIds } }, "description -_id")`
 * — the first combination whose cluster list contains every given cluster.
 *
 * When the quiz lands both archetypes in one cluster, several combinations
 * qualify: the single-cluster one written for exactly that case, and every pair
 * that includes it. Mongo returned whichever came first in natural order, which
 * is a pair — so `natural_order` reproduces that. Set COMBINATION_MATCH=exact
 * to instead pick the combination whose cluster list matches exactly, which is
 * what the single-cluster combinations appear to have been authored for.
 */
const findDescriptionByClusters = async (clusterIds) => {
  if (!clusterIds.length) return null;

  const exactMatch = process.env.COMBINATION_MATCH === "exact";

  const row = await queryOne(
    `SELECT c.description
       FROM combinations c
       JOIN combination_clusters cc ON cc.combination_id = c.id
      WHERE cc.cluster_id IN (?)
      GROUP BY c.id, c.description, c.cluster_count, c.natural_order
     HAVING COUNT(DISTINCT cc.cluster_id) = ?
        ${exactMatch ? "AND c.cluster_count = ?" : ""}
      ORDER BY c.natural_order, c.id
      LIMIT 1`,
    exactMatch
      ? [clusterIds, clusterIds.length, clusterIds.length]
      : [clusterIds, clusterIds.length]
  );

  return row ? { description: row.description } : null;
};

const combinationServices = {
  createCombination,
  getCombinationById,
  findDescriptionByClusters,
};
export default combinationServices;
