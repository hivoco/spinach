/**
 * One place that turns the environment into mysql2 connection options, shared
 * by the API routes and by scripts/migrate-mongo-to-mysql.mjs.
 *
 * DATABASE_URL wins when set. The SQLAlchemy-style driver suffix is accepted
 * and ignored, so `mysql+pymysql://user:pass@host/db` works as written.
 */
export const parseDatabaseUrl = (databaseUrl) => {
  const url = new URL(databaseUrl.replace(/^mysql\+\w+:\/\//, "mysql://"));

  if (!url.protocol.startsWith("mysql")) {
    throw new Error(`DATABASE_URL must be a mysql:// URL, got ${url.protocol}`);
  }

  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    // ?ssl=true / ?sslmode=require in the URL turn TLS on without a second var.
    ssl:
      url.searchParams.get("ssl") === "true" ||
      url.searchParams.get("sslmode") === "require",
  };
};

export const mysqlConfig = (env = process.env) => {
  const base = env.DATABASE_URL
    ? parseDatabaseUrl(env.DATABASE_URL)
    : {
        host: env.MYSQL_HOST,
        port: Number(env.MYSQL_PORT || 3306),
        user: env.MYSQL_USER,
        password: env.MYSQL_PASSWORD,
        database: env.MYSQL_DATABASE,
        ssl: false,
      };

  if (!base.host || !base.database) {
    throw new Error(
      "No database configured — set DATABASE_URL (or MYSQL_HOST/MYSQL_DATABASE) in .env.local"
    );
  }

  const useSsl = env.MYSQL_SSL === "true" || base.ssl;

  return {
    host: base.host,
    port: base.port,
    user: base.user,
    password: base.password,
    database: base.database,
    timezone: "Z",
    charset: "utf8mb4_general_ci",
    // Managed hosts (RDS, PlanetScale, Aiven) serve certs from their own CA.
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  };
};

export default mysqlConfig;
