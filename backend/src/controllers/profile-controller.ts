import type { Request, Response } from "express";
import { z } from "zod";

import { ok } from "../shared/http/api-response.js";
import { BadRequestError } from "../shared/http/http-errors.js";
import { userRepository } from "../repositories/user-repository.js";
import { env } from "../shared/env.js";

function toAbsoluteUrl(maybePath: string | null) {
  if (!maybePath) return null;
  if (maybePath.startsWith("http://") || maybePath.startsWith("https://")) {
    return maybePath;
  }
  const base = env.APP_URL.replace(/\/$/, "");
  const p = maybePath.startsWith("/") ? maybePath : `/${maybePath}`;
  return `${base}${p}`;
}

export class ProfileController {
  async get(req: Request, res: Response) {
    const user = await userRepository.getById(req.user!.id);
    const record = user
      ? {
          ...user,
          profile_image: toAbsoluteUrl(user.profile_image),
        }
      : null;
    return res.json(ok({ record }));
  }

  async update(req: Request, res: Response) {
    const raw = req.body as any;
    const hobbiesRaw = raw?.["hobbies[]"] ?? raw?.hobbies ?? [];
    const hobbies = Array.isArray(hobbiesRaw)
      ? hobbiesRaw
      : hobbiesRaw
        ? [hobbiesRaw]
        : [];

    const body = z
      .object({
        full_name: z.string().min(1),
        hobbies: z.array(z.string()).default([]),
      })
      .parse({
        full_name: raw?.full_name,
        hobbies,
      });

    const file = (req as any).file as
      | { originalname: string; filename: string }
      | undefined;

    let profileImage: string | null | undefined;
    if (file) {
      const ext = (file.originalname.split(".").pop() ?? "").toLowerCase();
      if (!["jpg", "jpeg", "png"].includes(ext)) {
        throw new BadRequestError("Only jpg/png images are allowed");
      }
      profileImage = `/${env.UPLOAD_DIR}/profiles/${file.filename}`;
    }

    const record = await userRepository.updateProfile(req.user!.id, {
      full_name: body.full_name,
      hobbies: body.hobbies,
      profile_image: profileImage,
    });

    const normalized = record
      ? {
          ...record,
          profile_image: toAbsoluteUrl(record.profile_image),
        }
      : null;

    return res.json(ok({ record: normalized }, "Updated"));
  }
}

export const profileController = new ProfileController();
