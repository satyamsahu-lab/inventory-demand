import { Router } from 'express';

import { authJwt } from '../middleware/auth-jwt.js';
import { rbacGuard } from '../middleware/rbac-guard.js';
import { permissionController } from '../controllers/permission-controller.js';

export const permissionRouter = Router();

permissionRouter.get('/matrix', authJwt, rbacGuard('Permissions', 'view'), (req, res, next) =>
  permissionController.matrix(req, res).catch(next)
);

permissionRouter.post('/role-permissions', authJwt, rbacGuard('Permissions', 'edit'), (req, res, next) =>
  permissionController.updateRolePermissions(req, res).catch(next)
);
