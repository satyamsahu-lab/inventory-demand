import type { Request, Response } from "express";
import { z } from "zod";

import { ok, created } from "../shared/http/api-response.js";
import { listingQuerySchema, buildPagination } from "../shared/http/listing.js";
import { getScopeAdminIdOrThrow } from "../shared/security/request-scope.js";
import { userRepository } from "../repositories/user-repository.js";
import { roleRepository } from "../repositories/role-repository.js";
import { hashPassword } from "../shared/security/password.js";
import { ForbiddenError } from "../shared/http/http-errors.js";
import type { DbUser } from "../repositories/user-repository.js";
import { csvFromRows, pdfTableBuffer } from "../shared/http/export.js";

export class UserController {
  async list(req: Request, res: Response) {
    const q = listingQuerySchema.parse(req.query);
    const scopeAdminId = getScopeAdminIdOrThrow(req);

    // Users module hidden for User role: enforced by permissions; extra guard
    if (req.user!.role.name === "User") {
      throw new ForbiddenError();
    }

    const result = await userRepository.list(scopeAdminId, q);

    const sanitized = result.records.map((u: DbUser) => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      role_id: u.role_id,
      role_name: u.role_name,
      status: u.status,
      profile_image: u.profile_image,
      hobbies: u.hobbies,
      created_at: u.created_at,
    }));

    return res.json(
      ok({
        records: sanitized,
        pagination: buildPagination(result.totalRecords, q.page, q.limit),
      }),
    );
  }

  async create(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    if (req.user!.role.name === "User") {
      throw new ForbiddenError();
    }

    const body = z
      .object({
        full_name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(8),
        role_id: z.string().uuid(),
        status: z.enum(["active", "inactive"]).optional(),
      })
      .parse(req.body);

    const role = await roleRepository.getById(body.role_id);
    if (!role) {
      throw new ForbiddenError("Role not found");
    }

    // Admin cannot create Super Admin users
    if (req.user!.role.name !== "Super Admin" && role.name === "Super Admin") {
      throw new ForbiddenError("Not allowed");
    }

    const passwordHash = await hashPassword(body.password);

    const createdUser = await userRepository.create({
      full_name: body.full_name,
      email: body.email,
      password: passwordHash,
      role_id: body.role_id,
      created_by_admin_id: scopeAdminId,
      status: body.status || "active",
    });

    if (!createdUser) {
      throw new ForbiddenError("Create failed");
    }

    return res.status(201).json(
      created({
        record: {
          id: createdUser.id,
          full_name: createdUser.full_name,
          email: createdUser.email,
          role_id: createdUser.role_id,
          role_name: createdUser.role_name,
          status: createdUser.status,
          profile_image: createdUser.profile_image,
          hobbies: createdUser.hobbies,
          created_at: createdUser.created_at,
        },
      }),
    );
  }

  async update(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    if (req.user!.role.name === "User") {
      throw new ForbiddenError();
    }

    const userId = z.string().uuid().parse(req.params.id);
    const body = z
      .object({
        full_name: z.string().min(1),
        role_id: z.string().uuid(),
        password: z.string().min(8).optional(),
        status: z.enum(["active", "inactive"]).optional(),
      })
      .parse(req.body);

    const role = await roleRepository.getById(body.role_id);
    if (!role) {
      throw new ForbiddenError("Role not found");
    }
    if (req.user!.role.name !== "Super Admin" && role.name === "Super Admin") {
      throw new ForbiddenError("Not allowed");
    }

    const passwordHash = body.password
      ? await hashPassword(body.password)
      : undefined;

    const updated = await userRepository.updateAdminUser(scopeAdminId, userId, {
      full_name: body.full_name,
      role_id: body.role_id,
      password: passwordHash,
      status: body.status,
    });

    if (!updated) {
      throw new ForbiddenError("Not allowed");
    }

    return res.json(
      ok(
        {
          record: {
            id: updated.id,
            full_name: updated.full_name,
            email: updated.email,
            role_id: updated.role_id,
            role_name: updated.role_name,
            status: updated.status,
            profile_image: updated.profile_image,
            hobbies: updated.hobbies,
            created_at: updated.created_at,
          },
        },
        "Updated",
      ),
    );
  }

  async export(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    if (req.user!.role.name === "User") {
      throw new ForbiddenError();
    }
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
        ? await userRepository.listByIds(scopeAdminId, ids)
        : exportScope === "page"
          ? await userRepository.list(
              scopeAdminId,
              listingQuerySchema.parse(req.query),
            )
          : await userRepository.list(
              scopeAdminId,
              listingQuerySchema.parse({ ...req.query, page: 1, limit: 10000 }),
            );

    const headers = ["full_name", "email", "role_name", "status", "created_at"];

    if (format === "csv") {
      const csv = csvFromRows(headers, result.records as any);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="users.csv"');
      return res.send(csv);
    }

    const pdf = await pdfTableBuffer("Users", headers, result.records as any);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="users.pdf"');
    return res.send(pdf);
  }

  async bulkUpdateStatus(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const { ids, status } = z
      .object({
        ids: z.array(z.string().uuid()),
        status: z.enum(["active", "inactive"]),
      })
      .parse(req.body);

    const updated = await userRepository.updateStatus(
      scopeAdminId,
      ids,
      status,
    );
    return res.json(ok({ count: updated.length }, "Status updated"));
  }
}

export const userController = new UserController();
