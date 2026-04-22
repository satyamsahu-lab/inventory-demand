import { pool } from "../db/pool.js";

export type ProductImageRow = {
  id: string;
  product_id: string;
  file_name: string;
  created_at: string;
};

class ProductImageRepository {
  async listByProductId(productId: string) {
    const { rows } = await pool.query<ProductImageRow>(
      `SELECT id, product_id, file_name, created_at
       FROM product_images
       WHERE product_id = $1
       ORDER BY created_at ASC`,
      [productId],
    );
    return rows;
  }

  async addMany(productId: string, fileNames: string[]) {
    if (fileNames.length === 0) return [];

    const values: string[] = [];
    const params: any[] = [];

    for (const fn of fileNames) {
      params.push(productId);
      params.push(fn);
      values.push(`($${params.length - 1}, $${params.length})`);
    }

    const { rows } = await pool.query<ProductImageRow>(
      `INSERT INTO product_images (product_id, file_name)
       VALUES ${values.join(", ")}
       RETURNING id, product_id, file_name, created_at`,
      params,
    );

    return rows;
  }

  async deleteByProductId(productId: string) {
    await pool.query("DELETE FROM product_images WHERE product_id = $1", [
      productId,
    ]);
  }

  async deleteById(productId: string, imageId: string) {
    const { rows } = await pool.query<
      Pick<ProductImageRow, "id" | "file_name">
    >(
      `DELETE FROM product_images
       WHERE product_id = $1 AND id = $2
       RETURNING id, file_name`,
      [productId, imageId],
    );
    return rows[0] ?? null;
  }
}

export const productImageRepository = new ProductImageRepository();
