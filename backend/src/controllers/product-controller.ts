import type { Request, Response } from "express";
import { z } from "zod";

import { ok, created } from "../shared/http/api-response.js";
import { listingQuerySchema, buildPagination } from "../shared/http/listing.js";
import { getScopeAdminIdOrThrow } from "../shared/security/request-scope.js";
import { productRepository } from "../repositories/product-repository.js";
import { productService } from "../services/product-service.js";
import { parseCsv, parseExcel } from "../shared/http/import.js";
import { csvFromRows, pdfTableBuffer } from "../shared/http/export.js";
import { BadRequestError } from "../shared/http/http-errors.js";
import { productImageRepository } from "../repositories/product-image-repository.js";
import { env } from "../shared/env.js";
import fs from "node:fs";
import path from "node:path";

function toAbsoluteUrl(maybePath: string) {
  if (maybePath.startsWith("http://") || maybePath.startsWith("https://")) {
    return maybePath;
  }
  const base = env.APP_URL.replace(/\/$/, "");
  const p = maybePath.startsWith("/") ? maybePath : `/${maybePath}`;
  return `${base}${p}`;
}

export class ProductController {
  async list(req: Request, res: Response) {
    const q = listingQuerySchema.parse(req.query);
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const isSuperAdmin = req.user?.role.name === "Super Admin";

    const result = await productRepository.list(scopeAdminId, q, isSuperAdmin);

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
    }));

    return res.json(
      ok({
        records,
        pagination: buildPagination(result.totalRecords, q.page, q.limit),
      }),
    );
  }

  async get(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const isSuperAdmin = req.user?.role.name === "Super Admin";
    const id = z.string().uuid().parse(req.params.id);

    const row = await productRepository.getById(scopeAdminId, id, isSuperAdmin);
    const images = row
      ? await productImageRepository.listByProductId(row.id)
      : [];
    const record = row
      ? {
          ...row,
          image_urls: images.map((i) =>
            toAbsoluteUrl(
              `/${env.UPLOAD_DIR}/products/${row.id}/${i.file_name}`,
            ),
          ),
          images: images.map((i) => ({
            id: i.id,
            url: toAbsoluteUrl(
              `/${env.UPLOAD_DIR}/products/${row.id}/${i.file_name}`,
            ),
          })),
        }
      : null;
    return res.json(ok({ record }));
  }

  async removeImage(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const productId = z.string().uuid().parse(req.params.id);
    const imageId = z.string().uuid().parse(req.params.imageId);
    const isSuperAdmin = req.user?.role.name === "Super Admin";

    const existing = await productRepository.getById(
      scopeAdminId,
      productId,
      isSuperAdmin,
    );
    if (!existing) {
      throw new BadRequestError("Product not found");
    }

    const deleted = await productImageRepository.deleteById(productId, imageId);
    if (!deleted) {
      throw new BadRequestError("Image not found");
    }

    const uploadRootCandidateA = path.resolve(process.cwd(), env.UPLOAD_DIR);
    const uploadRootCandidateB = path.resolve(
      process.cwd(),
      "backend",
      env.UPLOAD_DIR,
    );
    let uploadRoot = uploadRootCandidateA;
    if (fs.existsSync(uploadRootCandidateA)) {
      uploadRoot = uploadRootCandidateA;
    } else if (fs.existsSync(uploadRootCandidateB)) {
      uploadRoot = uploadRootCandidateB;
    }

    const filePath = path.resolve(
      uploadRoot,
      "products",
      productId,
      deleted.file_name,
    );
    try {
      fs.unlinkSync(filePath);
    } catch {
      // ignore
    }

    return res.json(ok({ ok: true }, "Deleted"));
  }

  async create(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const input = productService.validate(req.body);

    const row = await productRepository.create(scopeAdminId, {
      ...input,
      status: req.body.status || "active",
    });
    return res.status(201).json(created({ record: row }));
  }

  async update(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const id = z.string().uuid().parse(req.params.id);
    const input = productService.validate(req.body);
    const isSuperAdmin = req.user?.role.name === "Super Admin";

    const row = await productRepository.update(
      scopeAdminId,
      id,
      { ...input, status: req.body.status },
      isSuperAdmin,
    );
    return res.json(ok({ record: row }));
  }

  async addImages(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const id = z.string().uuid().parse(req.params.id);
    const isSuperAdmin = req.user?.role.name === "Super Admin";

    const existing = await productRepository.getById(
      scopeAdminId,
      id,
      isSuperAdmin,
    );
    if (!existing) {
      throw new BadRequestError("Product not found");
    }

    const files = ((req as any).files ?? []) as Array<{ filename: string }>;
    if (!files.length) {
      throw new BadRequestError("Images are required");
    }

    const fileNames = files.map((f) => f.filename);
    const rows = await productImageRepository.addMany(id, fileNames);

    return res.status(201).json(ok({ records: rows }, "Images added"));
  }

  async remove(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const id = z.string().uuid().parse(req.params.id);

    await productRepository.delete(scopeAdminId, id);
    return res.json(ok({ ok: true }, "Deleted"));
  }

  async bulkUpdateStatus(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const isSuperAdmin = req.user?.role.name === "Super Admin";
    const { ids, status } = z
      .object({
        ids: z.array(z.string().uuid()),
        status: z.enum(["active", "inactive"]),
      })
      .parse(req.body);

    const updated = await productRepository.updateStatus(
      scopeAdminId,
      ids,
      status,
      isSuperAdmin,
    );
    return res.json(ok({ count: updated.length }, "Status updated"));
  }

  async importFile(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);

    const file = (req as any).file as
      | { originalname: string; buffer: Buffer }
      | undefined;
    if (!file) {
      throw new BadRequestError("File is required");
    }

    const ext = (file.originalname.split(".").pop() ?? "").toLowerCase();

    let parsed: { headers: string[]; records: Array<Record<string, any>> };
    if (ext === "csv") {
      parsed = await parseCsv(file.buffer);
    } else if (ext === "xlsx" || ext === "xls") {
      parsed = await parseExcel(file.buffer);
    } else {
      throw new BadRequestError("Unsupported file type");
    }

    productService.assertHeaders(parsed.headers);

    const summary = await productService.importRecords(
      scopeAdminId,
      parsed.records,
    );

    return res.json(ok({ summary }, "Imported"));
  }

  async export(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const isSuperAdmin = req.user?.role.name === "Super Admin";
    const format = z.enum(["csv", "pdf"]).parse(req.query.format);

    const exportScope = z
      .enum(["selected", "page", "all"])
      .default("all")
      .parse(req.query.exportScope);

    const idsRaw = req.query.ids;
    const ids = z
      .array(z.string().uuid())
      .default([])
      .parse(
        typeof idsRaw === "string"
          ? idsRaw
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : Array.isArray(idsRaw)
            ? idsRaw
            : [],
      );

    const result =
      exportScope === "selected"
        ? await productRepository.listByIds(scopeAdminId, ids, isSuperAdmin)
        : exportScope === "page"
          ? await productRepository.list(
              scopeAdminId,
              listingQuerySchema.parse(req.query),
              isSuperAdmin,
            )
          : await productRepository.list(
              scopeAdminId,
              listingQuerySchema.parse({ ...req.query, page: 1, limit: 10000 }),
              isSuperAdmin,
            );

    const headers = [
      "name",
      "sku",
      "price",
      "min_stock_threshold",
      "created_at",
    ];

    if (format === "csv") {
      const csv = csvFromRows(headers, result.records as any);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="products.csv"',
      );
      return res.send(csv);
    }

    const pdf = await pdfTableBuffer(
      "Products",
      headers,
      result.records as any,
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="products.pdf"');
    return res.send(pdf);
  }
}

export const productController = new ProductController();
