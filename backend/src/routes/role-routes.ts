import { Router } from 'express';

import { authJwt } from '../middleware/auth-jwt.js';
import { rbacGuard } from '../middleware/rbac-guard.js';
import { roleController } from '../controllers/role-controller.js';

export const roleRouter = Router();

roleRouter.get('/', authJwt, rbacGuard('Roles', 'view'), (req, res, next) => roleController.list(req, res).catch(next));
roleRouter.post('/', authJwt, rbacGuard('Roles', 'add'), (req, res, next) => roleController.create(req, res).catch(next));
