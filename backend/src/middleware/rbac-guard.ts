import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError } from '../shared/http/http-errors.js';
import { permissionRepository } from '../repositories/permission-repository.js';

export function rbacGuard(moduleName: string, action: 'view' | 'add' | 'edit' | 'delete') {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return next(new ForbiddenError());
    }

    const ok = await permissionRepository.roleHasPermission(user.role.id, moduleName, action);
    if (!ok) {
      return next(new ForbiddenError());
    }

    return next();
  };
}
