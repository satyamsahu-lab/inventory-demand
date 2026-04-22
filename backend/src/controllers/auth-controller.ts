import type { Request, Response } from "express";
import { ok } from "../shared/http/api-response.js";
import { authService } from "../services/auth-service.js";
import { AuditLogService } from "../services/audit-log-service.js";

export class AuthController {
  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);

    await AuditLogService.log({
      userId: result.user.id,
      action: "LOGIN",
      module: "AUTH",
      description: `${result.user.role.name} logged in`,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.json(ok(result));
  }

  async forgotPassword(req: Request, res: Response) {
    const result = await authService.forgotPassword(req.body);

    await AuditLogService.log({
      action: "FORGOT_PASSWORD",
      module: "AUTH",
      description: `Forgot password request for email: ${req.body.email}`,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.json(
      ok(result, "If the email exists, a reset link has been sent"),
    );
  }

  async resetPassword(req: Request, res: Response) {
    const { token, password } = req.body as { token: string; password: string };
    const result = await authService.resetPasswordImpl(token, password);

    await AuditLogService.log({
      action: "RESET_PASSWORD",
      module: "AUTH",
      description: `Password reset successfully`,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.json(ok(result, "Password updated"));
  }

  async logout(req: Request, res: Response) {
    if (req.user) {
      await AuditLogService.log({
        userId: req.user.id,
        action: "LOGOUT",
        module: "AUTH",
        description: `${req.user.role.name} logged out`,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    }
    return res.json(ok({ ok: true }, "Logged out"));
  }
}

export const authController = new AuthController();
