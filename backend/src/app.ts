import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import fs from "node:fs";
import path from "node:path";

import { env } from "./shared/env.js";
import { apiRouter } from "./routes/index.js";
import { errorHandler } from "./shared/http/error-handler.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
    }),
  );

  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      limit: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use(express.json({ limit: "2mb" }));

  const uploadDirCandidateA = path.resolve(process.cwd(), env.UPLOAD_DIR);
  const uploadDirCandidateB = path.resolve(
    process.cwd(),
    "backend",
    env.UPLOAD_DIR,
  );
  const uploadDir = fs.existsSync(uploadDirCandidateA)
    ? uploadDirCandidateA
    : fs.existsSync(uploadDirCandidateB)
      ? uploadDirCandidateB
      : uploadDirCandidateA;
  fs.mkdirSync(uploadDir, { recursive: true });
  app.use("/uploads", express.static(uploadDir));

  app.use("/api", apiRouter);

  app.use(errorHandler);

  return app;
}
