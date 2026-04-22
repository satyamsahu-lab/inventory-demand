import type { Request, Response } from "express";
import { z } from "zod";
import { ok, created } from "../shared/http/api-response.js";
import { listingQuerySchema, buildPagination } from "../shared/http/listing.js";
import { getScopeAdminIdOrThrow } from "../shared/security/request-scope.js";
import { categoryRepository } from "../repositories/category-repository.js";

const categoryInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export class CategoryController {
  async list(req: Request, res: Response) {
    const q = listingQuerySchema.parse(req.query);
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const isSuperAdmin = req.user?.role.name === "Super Admin";

    // Allow filtering by parentId (null for categories, non-null for subcategories)
    const parentId = req.query.parentId;
    const result = await categoryRepository.list(
      scopeAdminId,
      { ...q, parentId: parentId as string | null },
      isSuperAdmin,
    );

    return res.json(
      ok({
        records: result.records,
        pagination: buildPagination(result.totalRecords, q.page, q.limit),
      }),
    );
  }

  async get(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const isSuperAdmin = req.user?.role.name === "Super Admin";
    const id = z.string().uuid().parse(req.params.id);

    const record = await categoryRepository.getById(
      scopeAdminId,
      id,
      isSuperAdmin,
    );
    return res.json(ok({ record }));
  }

  async create(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const input = categoryInputSchema.parse(req.body);

    const row = await categoryRepository.create(scopeAdminId, input);
    return res.status(201).json(created({ record: row }));
  }

  async update(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const id = z.string().uuid().parse(req.params.id);
    const input = categoryInputSchema.parse(req.body);

    const row = await categoryRepository.update(scopeAdminId, id, input);
    return res.json(ok({ record: row }));
  }

  async remove(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const id = z.string().uuid().parse(req.params.id);

    await categoryRepository.delete(scopeAdminId, id);
    return res.json(ok({ ok: true }, "Deleted"));
  }

  async bulkUpdateStatus(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const { ids, status } = z
      .object({
        ids: z.array(z.string().uuid()),
        status: z.enum(["active", "inactive"]),
      })
      .parse(req.body);

    const updated = await categoryRepository.updateStatus(
      scopeAdminId,
      ids,
      status,
    );
    return res.json(ok({ count: updated.length }, "Status updated"));
  }
}

export const categoryController = new CategoryController();
