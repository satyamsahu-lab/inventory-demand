import type { Request, Response } from 'express';
import { z } from 'zod';

import { ok } from '../shared/http/api-response.js';
import { ForbiddenError } from '../shared/http/http-errors.js';
import { roleRepository } from '../repositories/role-repository.js';
import { rolePermissionRepository } from '../repositories/role-permission-repository.js';
import { getScopeAdminIdOrThrow } from '../shared/security/request-scope.js';

export class PermissionController {
  async matrix(req: Request, res: Response) {
    const scopeAdminId = getScopeAdminIdOrThrow(req);
    const currentRoleId = req.user!.role.id;

    // Critical fix: hide current user role from permission module
    const roles = (await roleRepository.listVisibleRoles(req.user!.role.name, scopeAdminId)).filter(
      (r) => r.id !== currentRoleId
    );

    const permissions = await rolePermissionRepository.listAllPermissions();

    const rolePermissions: Record<string, string[]> = {};
    for (const role of roles) {
      rolePermissions[role.id] = await rolePermissionRepository.getRolePermissions(role.id);
    }

    return res.json(ok({ roles, permissions, rolePermissions }));
  }

  async updateRolePermissions(req: Request, res: Response) {
    const currentRoleId = req.user!.role.id;
    const scopeAdminId = getScopeAdminIdOrThrow(req);

    const body = z
      .object({
        role_id: z.string().uuid(),
        permission_ids: z.array(z.string().uuid())
      })
      .parse(req.body);

    // Critical fix: logged-in user cannot modify their own role permissions
    if (body.role_id === currentRoleId) {
      throw new ForbiddenError('You cannot modify your own role permissions');
    }

    const targetRole = await roleRepository.getById(body.role_id);
    if (!targetRole) {
      throw new ForbiddenError('Role not found');
    }

    // Admin isolation + rule: Admin cannot manage Super Admin role
    if (req.user!.role.name !== 'Super Admin') {
      if (targetRole.name === 'Super Admin') {
        throw new ForbiddenError('Not allowed');
      }
      if (targetRole.created_by_admin_id && targetRole.created_by_admin_id !== scopeAdminId) {
        throw new ForbiddenError('Not allowed');
      }
    }

    await rolePermissionRepository.replaceRolePermissions(body.role_id, body.permission_ids);
    return res.json(ok({ ok: true }, 'Updated'));
  }
}

export const permissionController = new PermissionController();
