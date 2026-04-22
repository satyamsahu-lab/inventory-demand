import { Router } from "express";
import multer from "multer";

import { authJwt } from "../middleware/auth-jwt.js";
import { rbacGuard } from "../middleware/rbac-guard.js";
import { inventoryController } from "../controllers/inventory-controller.js";
import { BadRequestError } from "../shared/http/http-errors.js";

export const inventoryRouter = Router();

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

inventoryRouter.get(
  "/",
  authJwt,
  rbacGuard("Inventory", "view"),
  (req, res, next) => inventoryController.list(req, res).catch(next),
);

inventoryRouter.post(
  "/",
  authJwt,
  rbacGuard("Inventory", "edit"),
  (req, res, next) => inventoryController.upsert(req, res).catch(next),
);

inventoryRouter.post(
  "/import",
  authJwt,
  rbacGuard("Inventory", "add"),
  upload.single("file"),
  (req, res, next) => inventoryController.importFile(req, res).catch(next),
);

inventoryRouter.get(
  "/low-stock",
  authJwt,
  rbacGuard("Inventory", "view"),
  (req, res, next) => inventoryController.lowStock(req, res).catch(next),
);
inventoryRouter.get(
  "/export/file",
  authJwt,
  rbacGuard("Inventory", "view"),
  (req, res, next) => inventoryController.export(req, res).catch(next),
);
