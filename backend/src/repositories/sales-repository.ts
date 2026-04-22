import { pool } from "../db/pool.js";
import type { ListingQuery } from "../shared/http/listing.js";

export type SalesRow = {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity_sold: number;
  sale_date: string;
};

export type SalesInput = {
  product_id: string;
  quantity_sold: number;
  sale_date: string;
};

class SalesRepository {
  async list(
    scopeAdminId: string,
    q: ListingQuery & { startDate?: string; endDate?: string },
  ) {
    const page = q.page;
    const limit = q.limit;
    const offset = (page - 1) * limit;

    const params: any[] = [scopeAdminId];
    const where: string[] = ["s.created_by_admin_id = $1"];

    if (q.search) {
      params.push(`%${q.search}%`);
      where.push(
        `(p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`,
      );
    }

    if (q.startDate && q.endDate) {
      params.push(q.startDate);
      where.push(`s.sale_date >= $${params.length}`);
      params.push(q.endDate);
      where.push(`s.sale_date <= $${params.length}`);
    }

    let orderBy = "sale_date";
    const allowedSort = new Set([
      "product_name",
      "sku",
      "quantity_sold",
      "sale_date",
    ]);
    if (q.sortBy && allowedSort.has(q.sortBy)) orderBy = q.sortBy;

    const sortOrder = q.sortOrder === "asc" ? "ASC" : "DESC";

    const countSql = `
      SELECT COUNT(*)::int as total
      FROM sales s
      JOIN products p ON p.id = s.product_id
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
        s.id,
        s.product_id,
        p.name as product_name,
        p.sku,
        s.quantity_sold,
        s.sale_date
      FROM sales s
      JOIN products p ON p.id = s.product_id
      WHERE ${where.join(" AND ")}
      ORDER BY ${orderBy} ${sortOrder}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const { rows } = await pool.query<SalesRow>(sql, params);

    return {
      records: rows,
      totalRecords: countRows[0]?.total ?? 0,
    };
  }

  async listByIds(scopeAdminId: string, ids: string[]) {
    if (ids.length === 0) {
      return { records: [] as SalesRow[], totalRecords: 0 };
    }

    const { rows } = await pool.query<SalesRow>(
      `SELECT
        s.id,
        s.product_id,
        p.name as product_name,
        p.sku,
        s.quantity_sold,
        s.sale_date::text as sale_date
       FROM sales s
       JOIN products p ON p.id = s.product_id
       WHERE s.created_by_admin_id = $1 AND s.id = ANY($2::uuid[])
       ORDER BY s.sale_date DESC`,
      [scopeAdminId, ids],
    );

    return { records: rows, totalRecords: rows.length };
  }

  async create(scopeAdminId: string, input: SalesInput) {
    const { rows } = await pool.query<SalesRow>(
      `INSERT INTO sales (created_by_admin_id, product_id, quantity_sold, sale_date)
       VALUES ($1, $2, $3, $4)
       RETURNING id, product_id, ''::text as product_name, ''::text as sku, quantity_sold, sale_date::text`,
      [scopeAdminId, input.product_id, input.quantity_sold, input.sale_date],
    );
    return rows[0];
  }

  async delete(scopeAdminId: string, id: string) {
    await pool.query(
      "DELETE FROM sales WHERE created_by_admin_id = $1 AND id = $2",
      [scopeAdminId, id],
    );
  }

  async update(scopeAdminId: string, id: string, input: SalesInput) {
    const { rows } = await pool.query<SalesRow>(
      `UPDATE sales
       SET product_id = $3,
           quantity_sold = $4,
           sale_date = $5
       WHERE created_by_admin_id = $1
         AND id = $2
       RETURNING id, product_id, ''::text as product_name, ''::text as sku, quantity_sold, sale_date::text`,
      [
        scopeAdminId,
        id,
        input.product_id,
        input.quantity_sold,
        input.sale_date,
      ],
    );
    return rows[0] ?? null;
  }

  async trends(scopeAdminId: string, days: number) {
    const { rows } = await pool.query<{ day: string; total: number }>(
      `SELECT sale_date::text as day, SUM(quantity_sold)::int as total
       FROM sales
       WHERE created_by_admin_id = $1 AND sale_date >= (current_date - $2::int)
       GROUP BY sale_date
       ORDER BY sale_date`,
      [scopeAdminId, days],
    );

    return rows;
  }
}

export const salesRepository = new SalesRepository();
