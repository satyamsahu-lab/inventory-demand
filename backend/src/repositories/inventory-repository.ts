import { pool } from "../db/pool.js";
import type { ListingQuery } from "../shared/http/listing.js";

export type InventoryRow = {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  min_stock_threshold: number;
  updated_at: string;
};

class InventoryRepository {
  async list(scopeAdminId: string, q: ListingQuery) {
    const page = q.page;
    const limit = q.limit;
    const offset = (page - 1) * limit;

    const params: any[] = [scopeAdminId];
    const where: string[] = ["i.created_by_admin_id = $1"];

    if (q.search) {
      params.push(`%${q.search}%`);
      where.push(
        `(p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`,
      );
    }

    let orderBy = "updated_at";
    const allowedSort = new Set([
      "product_name",
      "sku",
      "quantity",
      "min_stock_threshold",
      "updated_at",
    ]);
    if (q.sortBy && allowedSort.has(q.sortBy)) orderBy = q.sortBy;

    const sortOrder = q.sortOrder === "asc" ? "ASC" : "DESC";

    const countSql = `
      SELECT COUNT(*)::int as total
      FROM inventory i
      JOIN products p ON p.id = i.product_id
      WHERE ${where.join(" AND ")}
    `;

    const { rows: countRows } = await pool.query<{ total: number }>(
      countSql,
      params,
    );

    params.push(limit);
    params.push(offset);

    const sql = `
      SELECT
        i.id,
        i.product_id,
        p.name as product_name,
        p.sku,
        i.quantity,
        p.min_stock_threshold,
        i.updated_at
      FROM inventory i
      JOIN products p ON p.id = i.product_id
      WHERE ${where.join(" AND ")}
      ORDER BY ${orderBy} ${sortOrder}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const { rows } = await pool.query<InventoryRow>(sql, params);

    return {
      records: rows,
      totalRecords: countRows[0]?.total ?? 0,
    };
  }

  async upsert(scopeAdminId: string, productId: string, quantity: number) {
    const { rows } = await pool.query<InventoryRow>(
      `INSERT INTO inventory (created_by_admin_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (created_by_admin_id, product_id)
       DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = now()
       RETURNING
         id,
         product_id,
         ''::text as product_name,
         ''::text as sku,
         quantity,
         0::int as min_stock_threshold,
         updated_at`,
      [scopeAdminId, productId, quantity],
    );

    return rows[0];
  }

  async lowStock(scopeAdminId: string) {
    const { rows } = await pool.query<InventoryRow>(
      `SELECT
        i.id,
        i.product_id,
        p.name as product_name,
        p.sku,
        i.quantity,
        p.min_stock_threshold,
        i.updated_at
       FROM inventory i
       JOIN products p ON p.id = i.product_id
       WHERE i.created_by_admin_id = $1 AND i.quantity < p.min_stock_threshold
       ORDER BY (p.min_stock_threshold - i.quantity) DESC`,
      [scopeAdminId],
    );

    return rows;
  }
}

export const inventoryRepository = new InventoryRepository();
