import { pool } from "../db/pool.js";
import type { ListingQuery } from "../shared/http/listing.js";

export type ProductRow = {
  id: string;
  created_by_admin_id: string;
  name: string;
  sku: string;
  description: string | null;
  price: string;
  min_stock_threshold: number;
  status: string;
  first_image_file_name?: string | null;
  images?: Array<{ id: string; file_name: string }> | null;
  category_id?: string | null;
  subcategory_id?: string | null;
  category_name?: string | null;
  subcategory_name?: string | null;
  created_at: string;
};

export type ProductInput = {
  name: string;
  sku: string;
  description?: string | null;
  price: number;
  min_stock_threshold: number;
  status?: string;
  category_id: string;
  subcategory_id?: string | null;
};

class ProductRepository {
  async listPublic(q: ListingQuery) {
    const page = q.page;
    const limit = q.limit;
    const offset = (page - 1) * limit;

    const params: any[] = ["active"];
    const where: string[] = ["p.status = $1"];

    if (q.search) {
      params.push(`%${q.search}%`);
      where.push(
        `(p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`,
      );
    }

    if ((q as any).category_id) {
      params.push((q as any).category_id);
      where.push(`p.category_id = $${params.length}`);
    }

    if ((q as any).subcategory_id) {
      params.push((q as any).subcategory_id);
      where.push(`p.subcategory_id = $${params.length}`);
    }

    let orderBy = "p.updated_at";
    const allowedSort = new Set([
      "name",
      "sku",
      "price",
      "created_at",
      "updated_at",
    ]);
    if (q.sortBy && allowedSort.has(q.sortBy)) orderBy = `p.${q.sortBy}`;

    const sortOrder = q.sortOrder === "asc" ? "ASC" : "DESC";

    const countSql = `SELECT COUNT(*)::int as total FROM products p ${where.length ? "WHERE " + where.join(" AND ") : ""}`;
    const { rows: countRows } = await pool.query<{ total: number }>(
      countSql,
      params,
    );

    params.push(limit);
    params.push(offset);

    const sql = `
      SELECT p.id, p.name, p.sku, p.description, p.price::text, p.min_stock_threshold, p.status,
             p.category_id, p.subcategory_id,
             cat.name as category_name, subcat.name as subcategory_name,
             inv.quantity as stock_quantity,
             (
               SELECT pi.file_name
               FROM product_images pi
               WHERE pi.product_id = p.id
               ORDER BY pi.created_at ASC
               LIMIT 1
             ) as first_image_file_name,
             (
               SELECT COALESCE(
                 json_agg(
                   json_build_object('id', pi.id, 'file_name', pi.file_name)
                   ORDER BY pi.created_at ASC
                 ),
                 '[]'::json
               )
               FROM product_images pi
               WHERE pi.product_id = p.id
             ) as images,
             p.created_at, p.updated_at
      FROM products p
      LEFT JOIN categories cat ON cat.id = p.category_id
      LEFT JOIN categories subcat ON subcat.id = p.subcategory_id
      LEFT JOIN inventory inv ON inv.product_id = p.id
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY ${orderBy} ${sortOrder}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const { rows } = await pool.query<ProductRow>(sql, params);

    return {
      records: rows,
      totalRecords: countRows[0]?.total ?? 0,
    };
  }

  async getPublicById(id: string) {
    const { rows } = await pool.query<ProductRow>(
      `SELECT p.id, p.name, p.sku, p.description, p.price::text, p.min_stock_threshold, p.status,
              p.category_id, p.subcategory_id,
              cat.name as category_name, subcat.name as subcategory_name,
              inv.quantity as stock_quantity,
              p.created_at
       FROM products p
       LEFT JOIN categories cat ON cat.id = p.category_id
       LEFT JOIN categories subcat ON subcat.id = p.subcategory_id
       LEFT JOIN inventory inv ON inv.product_id = p.id
       WHERE p.id = $1 AND p.status = 'active'
       LIMIT 1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async list(
    scopeAdminId: string,
    q: ListingQuery,
    isSuperAdmin: boolean = false,
  ) {
    const page = q.page;
    const limit = q.limit;
    const offset = (page - 1) * limit;

    const params: any[] = [];
    const where: string[] = [];

    if (!isSuperAdmin) {
      params.push(scopeAdminId);
      where.push("p.created_by_admin_id = $1");
    }

    if (q.search) {
      params.push(`%${q.search}%`);
      where.push(
        `(p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`,
      );
    }

    let orderBy = "p.updated_at";
    const allowedSort = new Set([
      "name",
      "sku",
      "price",
      "min_stock_threshold",
      "created_at",
      "updated_at",
    ]);
    if (q.sortBy && allowedSort.has(q.sortBy)) orderBy = `p.${q.sortBy}`;

    const sortOrder = q.sortOrder === "asc" ? "ASC" : "DESC";

    const countSql = `SELECT COUNT(*)::int as total FROM products p ${where.length ? "WHERE " + where.join(" AND ") : ""}`;
    const { rows: countRows } = await pool.query<{ total: number }>(
      countSql,
      params,
    );

    params.push(limit);
    params.push(offset);

    const sql = `
      SELECT p.id, p.created_by_admin_id, p.name, p.sku, p.description, p.price::text, p.min_stock_threshold, p.status,
             p.category_id, p.subcategory_id,
             cat.name as category_name, subcat.name as subcategory_name,
             u.full_name as added_by,
             (
               SELECT pi.file_name
               FROM product_images pi
               WHERE pi.product_id = p.id
               ORDER BY pi.created_at ASC
               LIMIT 1
             ) as first_image_file_name,
             (
               SELECT COALESCE(
                 json_agg(
                   json_build_object('id', pi.id, 'file_name', pi.file_name)
                   ORDER BY pi.created_at ASC
                 ),
                 '[]'::json
               )
               FROM product_images pi
               WHERE pi.product_id = p.id
             ) as images,
             p.created_at, p.updated_at
      FROM products p
      LEFT JOIN users u ON u.id = p.created_by_admin_id
      LEFT JOIN categories cat ON cat.id = p.category_id
      LEFT JOIN categories subcat ON subcat.id = p.subcategory_id
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY ${orderBy} ${sortOrder}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const { rows } = await pool.query<ProductRow>(sql, params);

    return {
      records: rows,
      totalRecords: countRows[0]?.total ?? 0,
    };
  }

  async listByIds(
    scopeAdminId: string,
    ids: string[],
    isSuperAdmin: boolean = false,
  ) {
    if (ids.length === 0) {
      return { records: [] as ProductRow[], totalRecords: 0 };
    }

    const where = isSuperAdmin
      ? "p.id = ANY($1::uuid[])"
      : "p.created_by_admin_id = $1 AND p.id = ANY($2::uuid[])";
    const params = isSuperAdmin ? [ids] : [scopeAdminId, ids];

    const { rows } = await pool.query<ProductRow>(
      `SELECT p.id, p.created_by_admin_id, p.name, p.sku, p.description, p.price::text, p.min_stock_threshold, p.status,
             p.category_id, p.subcategory_id,
             cat.name as category_name, subcat.name as subcategory_name,
             u.full_name as added_by,
             (
               SELECT pi.file_name
               FROM product_images pi
               WHERE pi.product_id = p.id
               ORDER BY pi.created_at ASC
               LIMIT 1
             ) as first_image_file_name,
             (
               SELECT COALESCE(
                 json_agg(
                   json_build_object('id', pi.id, 'file_name', pi.file_name)
                   ORDER BY pi.created_at ASC
                 ),
                 '[]'::json
               )
               FROM product_images pi
               WHERE pi.product_id = p.id
             ) as images,
             p.created_at
       FROM products p
       LEFT JOIN users u ON u.id = p.created_by_admin_id
       LEFT JOIN categories cat ON cat.id = p.category_id
       LEFT JOIN categories subcat ON subcat.id = p.subcategory_id
       WHERE ${where}
       ORDER BY p.created_at DESC`,
      params,
    );

    return { records: rows, totalRecords: rows.length };
  }

  async getById(
    scopeAdminId: string,
    id: string,
    isSuperAdmin: boolean = false,
  ) {
    const where = isSuperAdmin
      ? "p.id = $1"
      : "p.created_by_admin_id = $1 AND p.id = $2";
    const params = isSuperAdmin ? [id] : [scopeAdminId, id];

    const { rows } = await pool.query<ProductRow>(
      `SELECT p.id, p.created_by_admin_id, p.name, p.sku, p.description, p.price::text, p.min_stock_threshold, p.status,
              p.category_id, p.subcategory_id,
              cat.name as category_name, subcat.name as subcategory_name,
              p.created_at,
              u.full_name as added_by
       FROM products p
       LEFT JOIN users u ON u.id = p.created_by_admin_id
       LEFT JOIN categories cat ON cat.id = p.category_id
       LEFT JOIN categories subcat ON subcat.id = p.subcategory_id
       WHERE ${where}
       LIMIT 1`,
      params,
    );
    return rows[0] ?? null;
  }

  async create(scopeAdminId: string, input: ProductInput) {
    const { rows } = await pool.query<ProductRow>(
      `INSERT INTO products (created_by_admin_id, name, sku, description, price, min_stock_threshold, category_id, subcategory_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, created_by_admin_id, name, sku, description, price::text, min_stock_threshold, status, category_id, subcategory_id, created_at`,
      [
        scopeAdminId,
        input.name,
        input.sku,
        input.description || null,
        input.price,
        input.min_stock_threshold,
        input.category_id,
        input.subcategory_id || null,
        input.status || "active",
      ],
    );
    return rows[0];
  }

  async update(
    scopeAdminId: string,
    id: string,
    input: ProductInput,
    isSuperAdmin: boolean = false,
  ) {
    const where = isSuperAdmin
      ? "id = $2::uuid AND ($1::uuid IS NOT NULL OR $1::uuid IS NULL)"
      : "created_by_admin_id = $1::uuid AND id = $2::uuid";
    const params = [
      scopeAdminId,
      id,
      input.name,
      input.sku,
      input.description || null,
      input.price,
      input.min_stock_threshold,
      input.category_id,
      input.subcategory_id || null,
      input.status || "active",
    ];

    const { rows } = await pool.query<ProductRow>(
      `UPDATE products
       SET name = $3, sku = $4, description = $5, price = $6, min_stock_threshold = $7, category_id = $8, subcategory_id = $9, status = $10, updated_at = NOW()
       WHERE ${where}
       RETURNING id, created_by_admin_id, name, sku, description, price::text, min_stock_threshold, status, category_id, subcategory_id, created_at, updated_at`,
      params,
    );
    return rows[0] ?? null;
  }

  async delete(scopeAdminId: string, id: string) {
    await pool.query(
      "DELETE FROM products WHERE created_by_admin_id = $1 AND id = $2",
      [scopeAdminId, id],
    );
  }

  async updateStatus(
    scopeAdminId: string,
    ids: string[],
    status: string,
    isSuperAdmin: boolean = false,
  ) {
    const where = isSuperAdmin
      ? "id = ANY($1::uuid[])"
      : "created_by_admin_id = $2::uuid AND id = ANY($1::uuid[])";
    const params = isSuperAdmin ? [ids, status] : [ids, scopeAdminId, status];

    const { rows } = await pool.query<ProductRow>(
      `UPDATE products
       SET status = $${params.length}, updated_at = NOW()
       WHERE ${where}
       RETURNING *`,
      params,
    );
    return rows;
  }
}

export const productRepository = new ProductRepository();
