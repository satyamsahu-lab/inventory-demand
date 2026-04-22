import { Router } from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";

import { authJwt } from "../middleware/auth-jwt.js";
import { profileController } from "../controllers/profile-controller.js";
import { env } from "../shared/env.js";

export const profileRouter = Router();

const uploadRootCandidateA = path.resolve(process.cwd(), env.UPLOAD_DIR);
const uploadRootCandidateB = path.resolve(
  process.cwd(),
  "backend",
  env.UPLOAD_DIR,
);
let uploadRoot = uploadRootCandidateA;
if (fs.existsSync(uploadRootCandidateA)) {
  uploadRoot = uploadRootCandidateA;
} else if (fs.existsSync(uploadRootCandidateB)) {
  uploadRoot = uploadRootCandidateB;
}

const dir = path.resolve(uploadRoot, "profiles");
fs.mkdirSync(dir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext = (file.originalname.split(".").pop() ?? "png").toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
});

// No permission required per requirements
profileRouter.get("/", authJwt, (req, res, next) =>
  profileController.get(req, res).catch(next),
);
profileRouter.put(
  "/",
  authJwt,
  upload.single("profile_image"),
  (req, res, next) => profileController.update(req, res).catch(next),
);
