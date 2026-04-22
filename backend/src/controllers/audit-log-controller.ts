import type { Request, Response } from "express";
import { AuditLogService } from "../services/audit-log-service.js";
import { ok } from "../shared/http/api-response.js";
import { z } from "zod";

export class AuditLogController {
  async list(req: Request, res: Response) {
    const page = Number.parseInt(req.query.page as string) || 1;
    const limit = Number.parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || "";
    const action = (req.query.action as string) || "";
    const startDate = (req.query.startDate as string) || "";
    const endDate = (req.query.endDate as string) || "";

    const result = await AuditLogService.getLogs(page, limit, {
      search,
      action,
      startDate,
      endDate,
    });
    return res.json(ok(result));
  }

  async logFrontendActivity(req: Request, res: Response) {
    const schema = z.object({
      action: z.string(),
      module: z.string(),
      description: z.string(),
      metadata: z.any().optional(),
    });

    const body = schema.parse(req.body);

    await AuditLogService.log({
      userId: req.user?.id,
      action: body.action,
      module: body.module,
      description: body.description,
      metadata: body.metadata,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.json(ok({ ok: true }));
  }
}

export const auditLogController = new AuditLogController();
