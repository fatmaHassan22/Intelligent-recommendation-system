import mysql, {
  type Pool,
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";
import type { Config } from "./config.js";
export type Executor = Pool | PoolConnection;
export function createPool(c: Config) {
  return mysql.createPool({
    host: c.DB_HOST,
    port: c.DB_PORT,
    database: c.DB_NAME,
    user: c.DB_USER,
    password: c.DB_PASSWORD,
    charset: "utf8mb4_unicode_ci",
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 100,
    supportBigNumbers: true,
    bigNumberStrings: true,
    dateStrings: true,
    multipleStatements: false,
  });
}
export async function rows<T = Record<string, any>>(
  db: Executor,
  sql: string,
  args: any[] = [],
): Promise<T[]> {
  const [result] = await db.execute<RowDataPacket[]>(sql, args);
  return result as T[];
}
export async function write(
  db: Executor,
  sql: string,
  args: any[] = [],
): Promise<ResultSetHeader> {
  const [result] = await db.execute<ResultSetHeader>(sql, args);
  return result;
}
export async function transaction<T>(
  pool: Pool,
  fn: (db: PoolConnection) => Promise<T>,
): Promise<T> {
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    const value = await fn(db);
    await db.commit();
    return value;
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    db.release();
  }
}
