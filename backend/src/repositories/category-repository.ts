import { pool } from "../db/pool.js";
import type { ListingQuery } from "../shared/http/listing.js";

export type CategoryRow = {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  status: string;
  created_by_admin_id: string;
  created_at: string;
  parent_name?: string | null;
};

export type CategoryInput = {
  name: string;
  description?: string | null;
  parent_id?: string | null;
  status?: string;
};

class CategoryRepository {
  async listPublic(
    q: ListingQuery & { parentId?: string | null; onlyActive?: boolean },
  ) {
    const page = q.page;
    const limit = q.limit;
    const offset = (page - 1) * limit;

    const params: any[] = [];
    const where: string[] = [];

    if (q.onlyActive) {
      where.push("c.status = 'active'");
    }

    if (q.search) {
      params.push(`%${q.search}%`);
      where.push(`c.name ILIKE $${params.length}`);
    }

    if (q.parentId !== undefined) {
      if (q.parentId === null || q.parentId === "null") {
        where.push("c.parent_id IS NULL");
      } else {
        params.push(q.parentId);
        where.push(`c.parent_id = $${params.length}`);
      }
    }

    let orderBy = "c.updated_at";
    const allowedSort = new Set(["name", "created_at", "updated_at"]);
    if (q.sortBy && allowedSort.has(q.sortBy)) orderBy = `c.${q.sortBy}`;

    const sortOrder = q.sortOrder === "asc" ? "ASC" : "DESC";

    const countSql = `SELECT COUNT(*)::int as total FROM categories c ${where.length ? "WHERE " + where.join(" AND ") : ""}`;
    const { rows: countRows } = await pool.query<{ total: number }>(
      countSql,
      params,
    );

    params.push(limit);
    params.push(offset);

    const sql = `
      SELECT c.*, p.name as parent_name
      FROM categories c
      LEFT JOIN categories p ON p.id = c.parent_id
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY ${orderBy} ${sortOrder}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const { rows } = await pool.query<CategoryRow>(sql, params);

    return {
      records: rows,
      totalRecords: countRows[0]?.total ?? 0,
    };
  }

  async list(
    scopeAdminId: string,
    q: ListingQuery & { parentId?: string | null },
    isSuperAdmin: boolean = false,
  ) {
    const page = q.page;
    const limit = q.limit;
    const offset = (page - 1) * limit;

    const params: any[] = [];
    const where: string[] = [];

    if (!isSuperAdmin) {
      params.push(scopeAdminId);
      where.push("c.created_by_admin_id = $1");
    }

    if (q.search) {
      params.push(`%${q.search}%`);
      where.push(`c.name ILIKE $${params.length}`);
    }

    if (q.parentId !== undefined) {
      if (q.parentId === null || q.parentId === "null") {
        where.push("c.parent_id IS NULL");
      } else {
        params.push(q.parentId);
        where.push(`c.parent_id = $${params.length}`);
      }
    }

    let orderBy = "c.updated_at";
    const allowedSort = new Set(["name", "created_at", "updated_at"]);
    if (q.sortBy && allowedSort.has(q.sortBy)) orderBy = `c.${q.sortBy}`;

    const sortOrder = q.sortOrder === "asc" ? "ASC" : "DESC";

    const countSql = `SELECT COUNT(*)::int as total FROM categories c ${where.length ? "WHERE " + where.join(" AND ") : ""}`;
    const { rows: countRows } = await pool.query<{ total: number }>(
      countSql,
      params,
    );

    params.push(limit);
    params.push(offset);

    const sql = `
      SELECT c.*, p.name as parent_name
      FROM categories c
      LEFT JOIN categories p ON p.id = c.parent_id
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY ${orderBy} ${sortOrder}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const { rows } = await pool.query<CategoryRow>(sql, params);

    return {
      records: rows,
      totalRecords: countRows[0]?.total ?? 0,
    };
  }

  async getById(
    scopeAdminId: string,
    id: string,
    isSuperAdmin: boolean = false,
  ) {
    const where = isSuperAdmin
      ? "c.id = $1"
      : "c.created_by_admin_id = $1 AND c.id = $2";
    const params = isSuperAdmin ? [id] : [scopeAdminId, id];

    const { rows } = await pool.query<CategoryRow>(
      `SELECT c.*, p.name as parent_name
       FROM categories c
       LEFT JOIN categories p ON p.id = c.parent_id
       WHERE ${where}
       LIMIT 1`,
      params,
    );
    return rows[0] ?? null;
  }

  async create(scopeAdminId: string, input: CategoryInput) {
    const { rows } = await pool.query<CategoryRow>(
      `INSERT INTO categories (created_by_admin_id, name, description, parent_id, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        scopeAdminId,
        input.name,
        input.description || null,
        input.parent_id || null,
        input.status || "active",
      ],
    );
    return rows[0];
  }

  async update(scopeAdminId: string, id: string, input: CategoryInput) {
    const { rows } = await pool.query<CategoryRow>(
      `UPDATE categories
       SET name = $3, description = $4, parent_id = $5, status = $6, updated_at = NOW()
       WHERE created_by_admin_id = $1 AND id = $2
       RETURNING *`,
      [
        scopeAdminId,
        id,
        input.name,
        input.description || null,
        input.parent_id || null,
        input.status || "active",
      ],
    );
    return rows[0] ?? null;
  }

  async delete(scopeAdminId: string, id: string) {
    await pool.query(
      "DELETE FROM categories WHERE created_by_admin_id = $1 AND id = $2",
      [scopeAdminId, id],
    );
  }

  async updateStatus(scopeAdminId: string, ids: string[], status: string) {
    const { rows } = await pool.query<CategoryRow>(
      `UPDATE categories
       SET status = $2, updated_at = NOW()
       WHERE created_by_admin_id = $1::uuid AND id = ANY($3::uuid[])
       RETURNING *`,
      [scopeAdminId, status, ids],
    );
    return rows;
  }
}

export const categoryRepository = new CategoryRepository();
