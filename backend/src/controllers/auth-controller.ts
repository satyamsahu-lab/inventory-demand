import type { Request, Response } from 'express';
import { ok } from '../shared/http/api-response.js';
import { authService } from '../services/auth-service.js';

export class AuthController {
  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    return res.json(ok(result));
  }

  async forgotPassword(req: Request, res: Response) {
    const result = await authService.forgotPassword(req.body);
    return res.json(ok(result, 'If the email exists, a reset link has been sent'));
  }

  async resetPassword(req: Request, res: Response) {
    const { token, password } = req.body as { token: string; password: string };
    const result = await authService.resetPasswordImpl(token, password);
    return res.json(ok(result, 'Password updated'));
  }

  async logout(_req: Request, res: Response) {
    return res.json(ok({ ok: true }, 'Logged out'));
  }
}

export const authController = new AuthController();
