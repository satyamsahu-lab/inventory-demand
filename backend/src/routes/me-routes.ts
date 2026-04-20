import { Router } from 'express';
import { authJwt } from '../middleware/auth-jwt.js';
import { meController } from '../controllers/me-controller.js';

export const meRouter = Router();

meRouter.get('/', authJwt, (req, res, next) => meController.me(req, res).catch(next));
