import type { Request, Response } from "express";
import { z } from "zod";

import { ok } from "../shared/http/api-response.js";
import { listingQuerySchema, buildPagination } from "../shared/http/listing.js";
import { getScopeAdminIdOrThrow } from "../shared/security/request-scope.js";
import { inventoryRepository } from "../repositories/inventory-repository.js";
import { parseCsv, parseExcel } from "../shared/http/import.js";
import { BadRequestError } from "../shared/http/http-errors.js";
import { csvFromRows, pdfTableBuffer } from "../shared/http/export.js";

export class InventoryController {
  async list(req: Request, res: Response) {
    const q = listingQuerySchema.parse(req.query);
    const scopeAdminId = getScopeAdminIdOrThrow(req);

    const result = await inventoryRepository.list(scopeAdminId, q);

    return res.json(
      ok({
        records: result.records,
        pagination: buildPagination(result.totalRecords, q.page, q.limit),
      }),
    );
  }

  async upsert(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const body = z
      .object({
        product_id: z.string().uuid(),
        quantity: z.coerce.number().int().nonnegative(),
      })
      .parse(req.body);

    const row = await inventoryRepository.upsert(
      scopeAdminId,
      body.product_id,
      body.quantity,
    );
    return res.json(ok({ record: row }, "Saved"));
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

    const required = ["sku", "quantity"];
    for (const r of required) {
      if (!parsed.headers.includes(r)) {
        throw new BadRequestError(`Missing required header: ${r}`);
      }
    }

    const { pool } = await import("../db/pool.js");
    const client = await pool.connect();
    let importedCount = 0;

    try {
      await client.query("BEGIN");
      for (const r of parsed.records) {
        const row = z
          .object({
            sku: z.string().min(1),
            quantity: z.coerce.number().int().nonnegative(),
          })
          .parse({ sku: r.sku, quantity: r.quantity });

        // Lookup product_id by SKU
        const pRes = await client.query(
          "SELECT id FROM products WHERE sku = $1 AND created_by_admin_id = $2",
          [row.sku, scopeAdminId],
        );

        if (pRes.rows.length === 0) {
          continue; // Skip if product not found
        }

        const productId = pRes.rows[0].id;

        await client.query(
          `INSERT INTO inventory (created_by_admin_id, product_id, quantity)
           VALUES ($1, $2, $3)
           ON CONFLICT (created_by_admin_id, product_id)
           DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = now()`,
          [scopeAdminId, productId, row.quantity],
        );
        importedCount++;
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    return res.json(
      ok({ summary: { insertedOrUpdated: importedCount } }, "Imported"),
    );
  }

  async lowStock(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const rows = await inventoryRepository.lowStock(scopeAdminId);
    return res.json(ok({ records: rows }));
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
        ? await inventoryRepository.listByIds(scopeAdminId, ids)
        : exportScope === "page"
          ? await inventoryRepository.list(
              scopeAdminId,
              listingQuerySchema.parse(req.query),
            )
          : await inventoryRepository.list(
              scopeAdminId,
              listingQuerySchema.parse({ ...req.query, page: 1, limit: 10000 }),
            );

    const headers = [
      "product_name",
      "sku",
      "quantity",
      "min_stock_threshold",
      "updated_at",
    ];

    if (format === "csv") {
      const csv = csvFromRows(headers, result.records as any);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="inventory.csv"',
      );
      return res.send(csv);
    }

    const pdf = await pdfTableBuffer(
      "Inventory",
      headers,
      result.records as any,
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="inventory.pdf"',
    );
    return res.send(pdf);
  }
}

export const inventoryController = new InventoryController();
