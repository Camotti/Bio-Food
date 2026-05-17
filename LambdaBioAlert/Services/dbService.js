import pg from 'pg';
import { getSecret } from "./ssmService.js";

let pool = null;

async function getPool() {
  if (pool) return pool;

  const host = await getSecret("/bioalert/db/host");
  const user = await getSecret("/bioalert/db/user");
  const password = await getSecret("/bioalert/db/password");
  const database = await getSecret("/bioalert/db/name");
  const port = await getSecret("/bioalert/db/port");

  pool = new pg.Pool({
    host,
    user,
    password,
    database,
    port: parseInt(port),
    ssl: { rejectUnauthorized: false } // Importante para AWS RDS
  });

  return pool;
}

export async function query(text, params) {
  const p = await getPool();
  const res = await p.query(text, params);
  return res.rows;
}