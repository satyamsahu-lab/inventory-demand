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
            profile_image: updated.profile_image,
            hobbies: updated.hobbies,
            created_at: updated.created_at,
          },
        },
        "Updated",
      ),
    );
  }
}

export const userController = new UserController();
