import type { Request, Response } from "express";
import { z } from "zod";

import { ok, created } from "../shared/http/api-response.js";
import { listingQuerySchema, buildPagination } from "../shared/http/listing.js";
import { pool } from "../db/pool.js";
import { AuditLogService } from "../services/audit-log-service.js";
import { getScopeAdminIdOrThrow } from "../shared/security/request-scope.js";
import { salesRepository } from "../repositories/sales-repository.js";
import { csvFromRows, pdfTableBuffer } from "../shared/http/export.js";
import { NotFoundError } from "../shared/http/http-errors.js";

export class SalesController {
  async list(req: Request, res: Response) {
    const q = listingQuerySchema.parse(req.query);
    const scopeAdminId = getScopeAdminIdOrThrow(req);

    const { startDate, endDate } = req.query as {
      startDate?: string;
      endDate?: string;
    };

    const result = await salesRepository.list(scopeAdminId, {
      ...(q as any),
      startDate,
      endDate,
    });

    await AuditLogService.log({
      userId: req.user!.id,
      action: "view",
      module: "SALES",
      description: `${req.user!.role.name} viewed sales list`,
      metadata: { page: q.page, limit: q.limit, startDate, endDate },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

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

    // Fetch SKU for audit log
    const { rows: pRows } = await pool.query(
      "SELECT sku FROM products WHERE id = $1",
      [body.product_id],
    );
    const sku = pRows[0]?.sku || body.product_id;

    await AuditLogService.log({
      userId: req.user!.id,
      action: "CREATE",
      module: "SALES",
      description: `${req.user!.role.name} recorded a sale for product (${sku}) of quantity ${body.quantity_sold}`,
      metadata: {
        productId: body.product_id,
        sku,
        quantitySold: body.quantity_sold,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.status(201).json(created({ record: row }));
  }

  async remove(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const id = z.string().uuid().parse(req.params.id);
    await salesRepository.delete(scopeAdminId, id);

    await AuditLogService.log({
      userId: req.user!.id,
      action: "DELETE",
      module: "SALES",
      description: `${req.user!.role.name} deleted a sale record (ID: ${id})`,
      metadata: { saleId: id },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

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

    await AuditLogService.log({
      userId: req.user!.id,
      action: "UPDATE",
      module: "SALES",
      description: `${req.user!.role.name} updated a sale record (ID: ${id})`,
      metadata: { saleId: id, ...body },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.json(ok({ record: updated }, "Updated"));
  }

  async export(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
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
        ? await salesRepository.listByIds(scopeAdminId, ids)
        : exportScope === "page"
          ? await salesRepository.list(
              scopeAdminId,
              listingQuerySchema.parse(req.query),
            )
          : await salesRepository.list(
              scopeAdminId,
              listingQuerySchema.parse({ ...req.query, page: 1, limit: 10000 }),
            );

    const headers = ["product_name", "sku", "quantity_sold", "sale_date"];

    if (format === "csv") {
      const csv = csvFromRows(headers, result.records as any);

      await AuditLogService.log({
        userId: req.user!.id,
        action: "EXPORT",
        module: "SALES",
        description: `${req.user!.role.name} exported sales as CSV`,
        metadata: { format: "csv", count: result.records.length },
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="sales.csv"');
      return res.send(csv);
    }

    const pdf = await pdfTableBuffer("Sales", headers, result.records as any);

    await AuditLogService.log({
      userId: req.user!.id,
      action: "EXPORT",
      module: "SALES",
      description: `${req.user!.role.name} exported sales as PDF`,
      metadata: { format: "pdf", count: result.records.length },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

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
