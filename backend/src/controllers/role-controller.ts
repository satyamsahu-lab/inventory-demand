import type { Request, Response } from 'express';
import { z } from 'zod';

import { ok, created } from '../shared/http/api-response.js';
import { roleRepository } from '../repositories/role-repository.js';
import { getScopeAdminIdOrThrow } from '../shared/security/request-scope.js';

export class RoleController {
  async list(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const roles = await roleRepository.listVisibleRoles(req.user!.role.name, scopeAdminId);
    return res.json(ok({ records: roles }));
  }

  async create(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const body = z.object({ name: z.string().min(1) }).parse(req.body);
    const role = await roleRepository.create(scopeAdminId, body.name);
    return res.status(201).json(created({ record: role }));
  }
}

export const roleController = new RoleController();
