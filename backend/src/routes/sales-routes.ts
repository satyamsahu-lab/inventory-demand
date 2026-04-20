import { Router } from "express";

import { authJwt } from "../middleware/auth-jwt.js";
import { rbacGuard } from "../middleware/rbac-guard.js";
import { salesController } from "../controllers/sales-controller.js";

export const salesRouter = Router();

salesRouter.get("/", authJwt, rbacGuard("Sales", "view"), (req, res, next) =>
  salesController.list(req, res).catch(next),
);
salesRouter.post("/", authJwt, rbacGuard("Sales", "add"), (req, res, next) =>
  salesController.create(req, res).catch(next),
);
salesRouter.put("/:id", authJwt, rbacGuard("Sales", "edit"), (req, res, next) =>
  salesController.update(req, res).catch(next),
);
salesRouter.delete(
  "/:id",
  authJwt,
  rbacGuard("Sales", "delete"),
  (req, res, next) => salesController.remove(req, res).catch(next),
);

salesRouter.get(
  "/export/file",
  authJwt,
  rbacGuard("Sales", "view"),
  (req, res, next) => salesController.export(req, res).catch(next),
);
salesRouter.get(
  "/trends",
  authJwt,
  rbacGuard("Sales", "view"),
  (req, res, next) => salesController.trends(req, res).catch(next),
);
