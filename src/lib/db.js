import mysql from "mysql2/promise";
import { mysqlConfig } from "@/lib/dbConfig.mjs";

/**
 * A single shared pool. Next.js hot-reloads modules in dev, so the pool is
 * cached on globalThis to avoid opening a new pool on every reload.
 */
const globalForDb = globalThis;

const createPool = () =>
  mysql.createPool({
    ...mysqlConfig(),
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_POOL_SIZE || 10),
    queueLimit: 0,
    dateStrings: false,
  });

export const pool = globalForDb.__archetypePool || createPool();

if (!globalForDb.__archetypePool) {
  globalForDb.__archetypePool = pool;
}

/** Run a query and get the rows back. */
export const query = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params);
  return rows;
};

/** Run a query and get only the first row (or null). */
export const queryOne = async (sql, params = []) => {
  const rows = await query(sql, params);
  return rows.length ? rows[0] : null;
};

/** Run `fn` inside a transaction, rolling back on any throw. */
export const withTransaction = async (fn) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export default pool;
