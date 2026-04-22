import type { Request, Response } from "express";
import { z } from "zod";
import { ok } from "../shared/http/api-response.js";
import { listingQuerySchema, buildPagination } from "../shared/http/listing.js";
import { categoryRepository } from "../repositories/category-repository.js";

export class CategoryPublicController {
  async list(req: Request, res: Response) {
    const q = listingQuerySchema.parse(req.query);
    const parentId = req.query.parentId;
    
    const result = await categoryRepository.listPublic({
      ...q,
      parentId: parentId as string | null,
    });

    return res.json(
      ok({
        records: result.records,
        pagination: buildPagination(result.totalRecords, q.page, q.limit),
      }),
    );
  }

  async getSubcategories(req: Request, res: Response) {
    const categoryId = z.string().uuid().parse(req.params.id);
    const q = listingQuerySchema.parse(req.query);
    
    const result = await categoryRepository.listPublic({
      ...q,
      parentId: categoryId,
    });

    return res.json(
      ok({
        records: result.records,
        pagination: buildPagination(result.totalRecords, q.page, q.limit),
      }),
    );
  }
}

export const categoryPublicController = new CategoryPublicController();
