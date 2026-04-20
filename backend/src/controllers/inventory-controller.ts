import type { Request, Response } from 'express';
import { z } from 'zod';

import { ok } from '../shared/http/api-response.js';
import { listingQuerySchema, buildPagination } from '../shared/http/listing.js';
import { getScopeAdminIdOrThrow } from '../shared/security/request-scope.js';
import { inventoryRepository } from '../repositories/inventory-repository.js';
import { parseCsv, parseExcel } from '../shared/http/import.js';
import { BadRequestError } from '../shared/http/http-errors.js';

export class InventoryController {
  async list(req: Request, res: Response) {
    const q = listingQuerySchema.parse(req.query);
    const scopeAdminId = getScopeAdminIdOrThrow(req);

    const result = await inventoryRepository.list(scopeAdminId, q);

    return res.json(
      ok({
        records: result.records,
        pagination: buildPagination(result.totalRecords, q.page, q.limit)
      })
    );
  }

  async upsert(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const body = z
      .object({
        product_id: z.string().uuid(),
        quantity: z.coerce.number().int().nonnegative()
      })
      .parse(req.body);

    const row = await inventoryRepository.upsert(scopeAdminId, body.product_id, body.quantity);
    return res.json(ok({ record: row }, 'Saved'));
  }

  async importFile(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);

    const file = (req as any).file as { originalname: string; buffer: Buffer } | undefined;
    if (!file) {
      throw new BadRequestError('File is required');
    }

    const ext = (file.originalname.split('.').pop() ?? '').toLowerCase();

    let parsed: { headers: string[]; records: Array<Record<string, any>> };
    if (ext === 'csv') {
      parsed = await parseCsv(file.buffer);
    } else if (ext === 'xlsx' || ext === 'xls') {
      parsed = await parseExcel(file.buffer);
    } else {
      throw new BadRequestError('Unsupported file type');
    }

    const required = ['product_id', 'quantity'];
    for (const r of required) {
      if (!parsed.headers.includes(r)) {
        throw new BadRequestError(`Missing required header: ${r}`);
      }
    }

    const rows = parsed.records.map((r) =>
      z
        .object({
          product_id: z.string().uuid(),
          quantity: z.coerce.number().int().nonnegative()
        })
        .parse({ product_id: r.product_id, quantity: r.quantity })
    );

    const { pool } = await import('../db/pool.js');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const row of rows) {
        await client.query(
          `INSERT INTO inventory (created_by_admin_id, product_id, quantity)
           VALUES ($1, $2, $3)
           ON CONFLICT (created_by_admin_id, product_id)
           DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = now()`,
          [scopeAdminId, row.product_id, row.quantity]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    return res.json(ok({ summary: { insertedOrUpdated: rows.length } }, 'Imported'));
  }

  async lowStock(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const rows = await inventoryRepository.lowStock(scopeAdminId);
    return res.json(ok({ records: rows }));
  }
}

export const inventoryController = new InventoryController();
