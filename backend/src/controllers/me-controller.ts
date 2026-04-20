import type { Request, Response } from 'express';
import { ok } from '../shared/http/api-response.js';
import { permissionRepository } from '../repositories/permission-repository.js';

export class MeController {
  async me(req: Request, res: Response) {
    const user = req.user!;
    const permissions = await permissionRepository.getPermissionsForRole(user.role.id);

    return res.json(
      ok({
        user,
        permissions
      })
    );
  }
}

export const meController = new MeController();
