import { Router } from "express";
import { authJwt } from "../middleware/auth-jwt.js";
import { rbacGuard } from "../middleware/rbac-guard.js";
import { categoryController } from "../controllers/category-controller.js";

export const categoryRouter = Router();

categoryRouter.use(authJwt);

categoryRouter.get("/", rbacGuard("Categories", "view"), (req, res, next) =>
  categoryController.list(req, res).catch(next),
);

categoryRouter.get("/:id", rbacGuard("Categories", "view"), (req, res, next) =>
  categoryController.get(req, res).catch(next),
);

categoryRouter.post("/", rbacGuard("Categories", "add"), (req, res, next) =>
  categoryController.create(req, res).catch(next),
);

categoryRouter.put("/:id", rbacGuard("Categories", "edit"), (req, res, next) =>
  categoryController.update(req, res).catch(next),
);

categoryRouter.post(
  "/bulk-status",
  rbacGuard("Categories", "edit"),
  (req, res, next) => categoryController.bulkUpdateStatus(req, res).catch(next),
);

categoryRouter.delete(
  "/:id",
  rbacGuard("Categories", "delete"),
  (req, res, next) => categoryController.remove(req, res).catch(next),
);
