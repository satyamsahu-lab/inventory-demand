import { Router } from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";

import { authJwt } from "../middleware/auth-jwt.js";
import { rbacGuard } from "../middleware/rbac-guard.js";
import { productController } from "../controllers/product-controller.js";
import { BadRequestError } from "../shared/http/http-errors.js";
import { env } from "../shared/env.js";

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

const uploadRootCandidateA = path.resolve(process.cwd(), env.UPLOAD_DIR);
const uploadRootCandidateB = path.resolve(
  process.cwd(),
  "backend",
  env.UPLOAD_DIR,
);
const uploadRoot = fs.existsSync(uploadRootCandidateA)
  ? uploadRootCandidateA
  : fs.existsSync(uploadRootCandidateB)
    ? uploadRootCandidateB
    : uploadRootCandidateA;

const productImagesRoot = path.resolve(uploadRoot, "products");
fs.mkdirSync(productImagesRoot, { recursive: true });

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const productId = String((req as any).params?.id ?? "");
      const dir = path.resolve(productImagesRoot, productId);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = (file.originalname.split(".").pop() ?? "png").toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    const ext = (file.originalname.split(".").pop() ?? "").toLowerCase();
    if (ext === "jpg" || ext === "jpeg" || ext === "png") return cb(null, true);
    return cb(new BadRequestError("Only jpg/png images are allowed") as any);
  },
  limits: { fileSize: 2 * 1024 * 1024 },
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

productRouter.post(
  "/bulk-status",
  authJwt,
  rbacGuard("Products", "edit"),
  (req, res, next) => productController.bulkUpdateStatus(req, res).catch(next),
);

productRouter.post(
  "/:id/images",
  authJwt,
  rbacGuard("Products", "edit"),
  imageUpload.array("images", 10),
  (req, res, next) => productController.addImages(req, res).catch(next),
);

productRouter.delete(
  "/:id/images/:imageId",
  authJwt,
  rbacGuard("Products", "edit"),
  (req, res, next) => productController.removeImage(req, res).catch(next),
);

productRouter.delete(
  "/:id",
  authJwt,
  rbacGuard("Products", "delete"),
  (req, res, next) => productController.remove(req, res).catch(next),
);
