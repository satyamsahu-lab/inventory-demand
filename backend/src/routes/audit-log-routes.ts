import { Router } from "express";
import { auditLogController } from "../controllers/audit-log-controller.js";
import { authJwt } from "../middleware/auth-jwt.js";
import { rbacGuard } from "../middleware/rbac-guard.js";

export const auditLogRouter = Router();

auditLogRouter.use(authJwt);

auditLogRouter.get(
  "/",
  rbacGuard("Audit Logs", "view"),
  auditLogController.list,
);

auditLogRouter.post("/client-activity", auditLogController.logFrontendActivity);
