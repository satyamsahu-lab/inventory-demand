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

export class ProductController {
  async list(req: Request, res: Response) {
    const q = listingQuerySchema.parse(req.query);
    const scopeAdminId = getScopeAdminIdOrThrow(req);

    const result = await productRepository.list(scopeAdminId, q);

    return res.json(
      ok({
        records: result.records,
        pagination: buildPagination(result.totalRecords, q.page, q.limit),
      }),
    );
  }

  async get(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const id = z.string().uuid().parse(req.params.id);

    const row = await productRepository.getById(scopeAdminId, id);
    return res.json(ok({ record: row }));
  }

  async create(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const input = productService.validate(req.body);

    const row = await productRepository.create(scopeAdminId, input);
    return res.status(201).json(created({ record: row }));
  }

  async update(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const id = z.string().uuid().parse(req.params.id);
    const input = productService.validate(req.body);

    const row = await productRepository.update(scopeAdminId, id, input);
    return res.json(ok({ record: row }));
  }

  async remove(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const id = z.string().uuid().parse(req.params.id);

    await productRepository.delete(scopeAdminId, id);
    return res.json(ok({ ok: true }, "Deleted"));
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
    const format = z.enum(["csv", "pdf"]).parse(req.query.format);

    const q = listingQuerySchema.parse({ ...req.query, page: 1, limit: 100 });
    const result = await productRepository.list(scopeAdminId, q);

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
