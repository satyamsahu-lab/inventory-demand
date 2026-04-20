import { Router } from 'express';
import { authController } from '../controllers/auth-controller.js';
import { validateBody } from '../shared/http/validate.js';
import { z } from 'zod';

export const authRouter = Router();

authRouter.post(
  '/login',
  validateBody(
    z.object({
      email: z.string().email(),
      password: z.string().min(1)
    })
  ),
  (req, res, next) => authController.login(req, res).catch(next)
);

authRouter.post(
  '/forgot-password',
  validateBody(
    z.object({
      email: z.string().email()
    })
  ),
  (req, res, next) => authController.forgotPassword(req, res).catch(next)
);

authRouter.post(
  '/reset-password',
  validateBody(
    z.object({
      token: z.string().min(10),
      password: z.string().min(8)
    })
  ),
  (req, res, next) => authController.resetPassword(req, res).catch(next)
);

authRouter.post('/logout', (req, res, next) => authController.logout(req, res).catch(next));
