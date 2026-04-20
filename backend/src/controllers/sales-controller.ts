import type { Request, Response } from "express";
import { z } from "zod";

import { ok, created } from "../shared/http/api-response.js";
import { listingQuerySchema, buildPagination } from "../shared/http/listing.js";
import { getScopeAdminIdOrThrow } from "../shared/security/request-scope.js";
import { salesRepository } from "../repositories/sales-repository.js";
import { csvFromRows, pdfTableBuffer } from "../shared/http/export.js";
import { NotFoundError } from "../shared/http/http-errors.js";

export class SalesController {
  async list(req: Request, res: Response) {
    const q = listingQuerySchema.parse(req.query);
    const scopeAdminId = getScopeAdminIdOrThrow(req);

    const result = await salesRepository.list(scopeAdminId, q);

    return res.json(
      ok({
        records: result.records,
        pagination: buildPagination(result.totalRecords, q.page, q.limit),
      }),
    );
  }

  async create(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const body = z
      .object({
        product_id: z.string().uuid(),
        quantity_sold: z.coerce.number().int().positive(),
        sale_date: z.string().min(10),
      })
      .parse(req.body);

    const row = await salesRepository.create(scopeAdminId, body);
    return res.status(201).json(created({ record: row }));
  }

  async remove(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const id = z.string().uuid().parse(req.params.id);
    await salesRepository.delete(scopeAdminId, id);
    return res.json(ok({ ok: true }, "Deleted"));
  }

  async update(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const id = z.string().uuid().parse(req.params.id);
    const body = z
      .object({
        product_id: z.string().uuid(),
        quantity_sold: z.coerce.number().int().positive(),
        sale_date: z.string().min(10),
      })
      .parse(req.body);

    const updated = await salesRepository.update(scopeAdminId, id, body);
    if (!updated) {
      throw new NotFoundError("Sale not found");
    }
    return res.json(ok({ record: updated }, "Updated"));
  }

  async export(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const format = z.enum(["csv", "pdf"]).parse(req.query.format);

    const q = listingQuerySchema.parse({ ...req.query, page: 1, limit: 100 });
    const result = await salesRepository.list(scopeAdminId, q);

    const headers = ["product_name", "sku", "quantity_sold", "sale_date"];

    if (format === "csv") {
      const csv = csvFromRows(headers, result.records as any);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="sales.csv"');
      return res.send(csv);
    }

    const pdf = await pdfTableBuffer("Sales", headers, result.records as any);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="sales.pdf"');
    return res.send(pdf);
  }

  async trends(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const days = z.coerce
      .number()
      .int()
      .min(1)
      .max(365)
      .default(30)
      .parse(req.query.days);
    const rows = await salesRepository.trends(scopeAdminId, days);
    return res.json(ok({ records: rows }));
  }
}

export const salesController = new SalesController();
