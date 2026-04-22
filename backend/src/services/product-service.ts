import { z } from "zod";
import { BadRequestError } from "../shared/http/http-errors.js";
import { productRepository } from "../repositories/product-repository.js";

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().max(1000).nullable().optional(),
  price: z.coerce.number().nonnegative(),
  min_stock_threshold: z.coerce.number().int().nonnegative(),
  category_id: z.string().uuid(),
  subcategory_id: z.string().uuid().nullable().optional(),
});

export class ProductService {
  validate(input: unknown) {
    return productSchema.parse(input);
  }

  async importRecords(
    scopeAdminId: string,
    records: Array<Record<string, any>>,
  ) {
    // Strict header validation is done at controller level; here we only coerce and validate
    const parsed = records.map((r) =>
      this.validate({
        name: r.name,
        sku: r.sku,
        price: r.price,
        min_stock_threshold: r.min_stock_threshold,
      }),
    );

    // Transaction + no partial import
    const { pool } = await import("../db/pool.js");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const p of parsed) {
        await client.query(
          `INSERT INTO products (created_by_admin_id, name, sku, description, price, min_stock_threshold)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (created_by_admin_id, sku)
           DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price, min_stock_threshold = EXCLUDED.min_stock_threshold`,
          [
            scopeAdminId,
            p.name,
            p.sku,
            (p as any).description || null,
            p.price,
            p.min_stock_threshold,
          ],
        );
      }
      await client.query("COMMIT");
      return {
        insertedOrUpdated: parsed.length,
      };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  assertHeaders(headers: string[]) {
    const required = ["name", "sku", "price", "min_stock_threshold"];
    const normalized = headers.map((h) => h.trim());
    for (const r of required) {
      if (!normalized.includes(r)) {
        throw new BadRequestError(`Missing required header: ${r}`);
      }
    }
  }
}

export const productService = new ProductService();
