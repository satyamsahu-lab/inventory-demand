import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";

import { authJwt } from "../middleware/auth-jwt.js";
import { env } from "../shared/env.js";
import { ok } from "../shared/http/api-response.js";
import { BadRequestError } from "../shared/http/http-errors.js";

export const uploadRouter = Router();

const tempDir = path.resolve(process.cwd(), env.UPLOAD_DIR, "temp");
fs.mkdirSync(tempDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tempDir),
  filename: (_req, file, cb) => {
    const ext = (file.originalname.split(".").pop() ?? "png").toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ext = (file.originalname.split(".").pop() ?? "").toLowerCase();
    if (ext === "jpg" || ext === "jpeg" || ext === "png") return cb(null, true);
    return cb(new BadRequestError("Only jpg/png images are allowed") as any);
  },
  limits: { fileSize: 2 * 1024 * 1024 },
});

uploadRouter.post(
  "/image",
  authJwt,
  upload.single("image"),
  async (req, res) => {
    const file = (req as any).file as { filename: string } | undefined;
    if (!file) throw new BadRequestError("Image is required");

    return res.json(
      ok({
        tempFileName: file.filename,
        tempUrl: `/uploads/temp/${file.filename}`,
      }),
    );
  },
);
