import { pool } from "../db/pool.js";
import type { ListingQuery } from "../shared/http/listing.js";

export type ProductRow = {
  id: string;
  created_by_admin_id: string;
  name: string;
  sku: string;
  price: string;
  min_stock_threshold: number;
  created_at: string;
};

export type ProductInput = {
  name: string;
  sku: string;
  price: number;
  min_stock_threshold: number;
};

class ProductRepository {
  async list(scopeAdminId: string, q: ListingQuery) {
    const page = q.page;
    const limit = q.limit;
    const offset = (page - 1) * limit;

    const params: any[] = [scopeAdminId];
    const where: string[] = ["created_by_admin_id = $1"];

    if (q.search) {
      params.push(`%${q.search}%`);
      where.push(
        `(name ILIKE $${params.length} OR sku ILIKE $${params.length})`,
      );
    }

    let orderBy = "created_at";
    const allowedSort = new Set([
      "name",
      "sku",
      "price",
      "min_stock_threshold",
      "created_at",
    ]);
    if (q.sortBy && allowedSort.has(q.sortBy)) orderBy = q.sortBy;

    const sortOrder = q.sortOrder === "asc" ? "ASC" : "DESC";

    const countSql = `SELECT COUNT(*)::int as total FROM products WHERE ${where.join(" AND ")}`;
    const { rows: countRows } = await pool.query<{ total: number }>(
      countSql,
      params,
    );

    params.push(limit);
    params.push(offset);

    const sql = `
      SELECT id, created_by_admin_id, name, sku, price::text, min_stock_threshold, created_at
      FROM products
      WHERE ${where.join(" AND ")}
      ORDER BY ${orderBy} ${sortOrder}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const { rows } = await pool.query<ProductRow>(sql, params);

    return {
      records: rows,
      totalRecords: countRows[0]?.total ?? 0,
    };
  }

  async getById(scopeAdminId: string, id: string) {
    const { rows } = await pool.query<ProductRow>(
      `SELECT id, created_by_admin_id, name, sku, price::text, min_stock_threshold, created_at
       FROM products
       WHERE created_by_admin_id = $1 AND id = $2
       LIMIT 1`,
      [scopeAdminId, id],
    );
    return rows[0] ?? null;
  }

  async create(scopeAdminId: string, input: ProductInput) {
    const { rows } = await pool.query<ProductRow>(
      `INSERT INTO products (created_by_admin_id, name, sku, price, min_stock_threshold)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_by_admin_id, name, sku, price::text, min_stock_threshold, created_at`,
      [
        scopeAdminId,
        input.name,
        input.sku,
        input.price,
        input.min_stock_threshold,
      ],
    );
    return rows[0];
  }

  async update(scopeAdminId: string, id: string, input: ProductInput) {
    const { rows } = await pool.query<ProductRow>(
      `UPDATE products
       SET name = $3, sku = $4, price = $5, min_stock_threshold = $6
       WHERE created_by_admin_id = $1 AND id = $2
       RETURNING id, created_by_admin_id, name, sku, price::text, min_stock_threshold, created_at`,
      [
        scopeAdminId,
        id,
        input.name,
        input.sku,
        input.price,
        input.min_stock_threshold,
      ],
    );
    return rows[0] ?? null;
  }

  async delete(scopeAdminId: string, id: string) {
    await pool.query(
      "DELETE FROM products WHERE created_by_admin_id = $1 AND id = $2",
      [scopeAdminId, id],
    );
  }
}

export const productRepository = new ProductRepository();
