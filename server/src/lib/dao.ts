import { query, queryOne, exec } from './pg-db';

/** Escape a column name for use in SQL (prevents injection on identifiers). */
function ident(name: string): string {
  return '"' + name.replace(/"/g, '""') + '"';
}

/** Serialize a JavaScript value to PostgreSQL JSONB text. */
function toJson(value: unknown): string {
  return JSON.stringify(value);
}

/** Build a WHERE clause from a filter object. Only supports equality on top-level keys. */
function whereClause(filter: Record<string, unknown>): { text: string; params: unknown[] } {
  const keys = Object.keys(filter);
  if (keys.length === 0) return { text: '', params: [] };
  const params: unknown[] = [];
  const clauses = keys.map((key, i) => {
    params.push(filter[key]);
    return `${ident(key)} = $${i + 1}`;
  });
  return { text: ' WHERE ' + clauses.join(' AND '), params };
}

/** Build a SET clause from a data object. */
function setClause(data: Record<string, unknown>): { text: string; params: unknown[] } {
  const keys = Object.keys(data);
  const params: unknown[] = [];
  const clauses = keys.map((key) => {
    const value = data[key];
    params.push(value === undefined ? null : value);
    return `${ident(key)} = $${params.length}`;
  });
  return { text: clauses.join(', '), params };
}

/** Find many rows from a table. */
export async function findMany(table: string, opts?: {
  where?: Record<string, unknown>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  take?: number;
}): Promise<Record<string, unknown>[]> {
  const where = opts?.where ?? {};
  const orderBy = opts?.orderBy ?? {};
  let sql = `SELECT * FROM ${ident(table)}`;
  const { text: whereText, params: whereParams } = whereClause(where);
  sql += whereText;
  if (Object.keys(orderBy).length > 0) {
    const [[key, dir]] = Object.entries(orderBy);
    sql += ` ORDER BY ${ident(key)} ${dir === 'desc' ? 'DESC' : 'ASC'}`;
  }
  if (opts?.take) sql += ` LIMIT $${whereParams.length + 1}`;
  const params = [...whereParams, ...(opts?.take ? [opts.take] : [])];
  return (await query(sql, params)) as Record<string, unknown>[];
}

/** Find one row by id. */
export async function findUnique(table: string, id: string): Promise<Record<string, unknown> | null> {
  return (await queryOne(`SELECT * FROM ${ident(table)} WHERE id = $1`, [id])) as Record<string, unknown> | null;
}

/** Find one row matching a filter. */
export async function findFirst(table: string, where: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const { text: whereText, params } = whereClause(where);
  return (await queryOne(`SELECT * FROM ${ident(table)}${whereText} LIMIT 1`, params)) as Record<string, unknown> | null;
}

/** Create a row. JSONB fields are serialized automatically. */
export async function create(table: string, data: Record<string, unknown>): Promise<unknown> {
  const keys = Object.keys(data);
  const params: unknown[] = [];
  const columns: string[] = [];
  const placeholders: string[] = [];
  keys.forEach((key) => {
    const value = data[key];
    columns.push(ident(key));
    if (value === undefined) {
      placeholders.push(`NULL`);
    } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
      // JSONB field (objects and arrays)
      params.push(toJson(value));
      placeholders.push(`$${params.length}::jsonb`);
    } else {
      params.push(value);
      placeholders.push(`$${params.length}`);
    }
  });
  const sql = `INSERT INTO ${ident(table)} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
  return queryOne(sql, params);
}

/** Update a row by id. */
export async function update(table: string, id: string, data: Record<string, unknown>): Promise<unknown | null> {
  const { text: setText, params } = setClause(data);
  const sql = `UPDATE ${ident(table)} SET ${setText}, "updatedAt" = now() WHERE id = $${params.length + 1} RETURNING *`;
  return (await queryOne(sql, [...params, id])) as Record<string, unknown> | null;
}

/** Delete a row by id. Returns the deleted row or null. */
export async function del(table: string, id: string): Promise<unknown | null> {
  return queryOne(`DELETE FROM ${ident(table)} WHERE id = $1 RETURNING *`, [id]);
}

/** Delete many rows matching a filter. */
export async function deleteMany(table: string, where: Record<string, unknown>): Promise<number> {
  const { text: whereText, params } = whereClause(where);
  const sql = `DELETE FROM ${ident(table)}${whereText}`;
  const result = await exec(sql, params);
  return result;
}

/** Count rows matching a filter. */
export async function count(table: string, where: Record<string, unknown>): Promise<number> {
  const { text: whereText, params } = whereClause(where);
  const result = await queryOne(`SELECT COUNT(*) FROM ${ident(table)}${whereText}`, params);
  return Number((result as { count: string }).count);
}
