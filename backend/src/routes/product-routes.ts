import { Router } from "express";
import multer from "multer";

import { authJwt } from "../middleware/auth-jwt.js";
import { rbacGuard } from "../middleware/rbac-guard.js";
import { productController } from "../controllers/product-controller.js";
import { BadRequestError } from "../shared/http/http-errors.js";

export const productRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const ext = (file.originalname.split(".").pop() ?? "").toLowerCase();
    if (ext === "csv" || ext === "xlsx") return cb(null, true);
    return cb(
      new BadRequestError("Only .csv or .xlsx files are allowed") as any,
    );
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

productRouter.get(
  "/",
  authJwt,
  rbacGuard("Products", "view"),
  (req, res, next) => productController.list(req, res).catch(next),
);

productRouter.post(
  "/import",
  authJwt,
  rbacGuard("Products", "add"),
  upload.single("file"),
  (req, res, next) => productController.importFile(req, res).catch(next),
);

productRouter.get(
  "/export/file",
  authJwt,
  rbacGuard("Products", "view"),
  (req, res, next) => productController.export(req, res).catch(next),
);

productRouter.get(
  "/:id",
  authJwt,
  rbacGuard("Products", "view"),
  (req, res, next) => productController.get(req, res).catch(next),
);

productRouter.post(
  "/",
  authJwt,
  rbacGuard("Products", "add"),
  (req, res, next) => productController.create(req, res).catch(next),
);

productRouter.put(
  "/:id",
  authJwt,
  rbacGuard("Products", "edit"),
  (req, res, next) => productController.update(req, res).catch(next),
);

productRouter.delete(
  "/:id",
  authJwt,
  rbacGuard("Products", "delete"),
  (req, res, next) => productController.remove(req, res).catch(next),
);
