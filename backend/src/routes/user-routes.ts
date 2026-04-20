import { Router } from "express";

import { authJwt } from "../middleware/auth-jwt.js";
import { rbacGuard } from "../middleware/rbac-guard.js";
import { userController } from "../controllers/user-controller.js";

export const userRouter = Router();

userRouter.get("/", authJwt, rbacGuard("Users", "view"), (req, res, next) =>
  userController.list(req, res).catch(next),
);
userRouter.post("/", authJwt, rbacGuard("Users", "add"), (req, res, next) =>
  userController.create(req, res).catch(next),
);
userRouter.put("/:id", authJwt, rbacGuard("Users", "edit"), (req, res, next) =>
  userController.update(req, res).catch(next),
);
