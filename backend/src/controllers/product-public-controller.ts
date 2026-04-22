import type { Request, Response } from "express";
import { z } from "zod";
import { ok } from "../shared/http/api-response.js";
import { listingQuerySchema, buildPagination } from "../shared/http/listing.js";
import { productRepository } from "../repositories/product-repository.js";
import { AuditLogService } from "../services/audit-log-service.js";
import { env } from "../shared/env.js";

function toAbsoluteUrl(maybePath: string) {
  if (!maybePath) return null;
  if (maybePath.startsWith("http://") || maybePath.startsWith("https://")) {
    return maybePath;
  }
  const base = env.APP_URL.replace(/\/$/, "");
  const p = maybePath.startsWith("/") ? maybePath : `/${maybePath}`;
  return `${base}${p}`;
}

export class ProductPublicController {
  async list(req: Request, res: Response) {
    const q = listingQuerySchema.parse(req.query);

    // Additional filters for storefront
    const storefrontQuery = {
      ...q,
      category_id: req.query.category_id,
      subcategory_id: req.query.subcategory_id,
    };

    const result = await productRepository.listPublic(storefrontQuery);

    const records = result.records.map((r: any) => ({
      ...r,
      image_urls: (r.images ?? []).map((i: any) =>
        toAbsoluteUrl(`/${env.UPLOAD_DIR}/products/${r.id}/${i.file_name}`),
      ),
      images: (r.images ?? []).map((i: any) => ({
        id: i.id,
        url: toAbsoluteUrl(
          `/${env.UPLOAD_DIR}/products/${r.id}/${i.file_name}`,
        ),
      })),
      first_image_url: toAbsoluteUrl(
        r.first_image_file_name
          ? `/${env.UPLOAD_DIR}/products/${r.id}/${r.first_image_file_name}`
          : "",
      ),
    }));

    return res.json(
      ok({
        records,
        pagination: buildPagination(result.totalRecords, q.page, q.limit),
      }),
    );
  }

  async get(req: Request, res: Response) {
    const id = z.string().uuid().parse(req.params.id);
    const row = await productRepository.getPublicById(id);

    if (!row) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Get images separately for the detail view
    const { pool } = await import("../db/pool.js");
    const { rows: images } = await pool.query(
      "SELECT id, file_name FROM product_images WHERE product_id = $1 ORDER BY created_at ASC",
      [id],
    );

    const record = {
      ...row,
      image_urls: images.map((i: any) =>
        toAbsoluteUrl(`/${env.UPLOAD_DIR}/products/${id}/${i.file_name}`),
      ),
      images: images.map((i: any) => ({
        id: i.id,
        url: toAbsoluteUrl(`/${env.UPLOAD_DIR}/products/${id}/${i.file_name}`),
      })),
    };

    if (req.user) {
      await AuditLogService.log({
        userId: req.user.id,
        action: "view",
        module: "PRODUCTS",
        description: `User viewed product (${record.sku}) on storefront`,
        metadata: { productId: id },
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    }

    return res.json(ok({ record }));
  }
}

export const productPublicController = new ProductPublicController();
