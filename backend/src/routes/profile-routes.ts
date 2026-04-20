import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';

import { authJwt } from '../middleware/auth-jwt.js';
import { env } from '../shared/env.js';
import { profileController } from '../controllers/profile-controller.js';

export const profileRouter = Router();

const dir = path.resolve(process.cwd(), env.UPLOAD_DIR, 'profiles');
fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dir),
  filename: (_req, file, cb) => {
    const ext = (file.originalname.split('.').pop() ?? 'png').toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }
});

// No permission required per requirements
profileRouter.get('/', authJwt, (req, res, next) => profileController.get(req, res).catch(next));
profileRouter.put('/', authJwt, upload.single('profile_image'), (req, res, next) =>
  profileController.update(req, res).catch(next)
);
