import type { Request, Response } from "express";
import { z } from "zod";
import { ok, created } from "../shared/http/api-response.js";
import { authService } from "../services/auth-service.js";
import { userRepository } from "../repositories/user-repository.js";
import { roleRepository } from "../repositories/role-repository.js";
import { hashPassword } from "../shared/security/password.js";

const registerSchema = z.object({
  fullName: z.string().min(2).max(200),
  email: z.string().email(),
  password: z.string().min(8),
});

export class UserAuthController {
  async register(req: Request, res: Response) {
    const { fullName, email, password } = registerSchema.parse(req.body);

    const existing = await userRepository.getByEmail(email);
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Get the "User" role ID
    const roles = await roleRepository.listVisibleRoles("Super Admin", "");
    const userRole = roles.find(r => r.name === "User");
    if (!userRole) {
      throw new Error("User role not found");
    }

    const hashedPassword = await hashPassword(password);
    
    // For storefront users, we'll set created_by_admin_id to null or a system ID
    // In this project's current logic, it seems mandatory. We'll find the Super Admin to be the "creator".
    const { pool } = await import("../db/pool.js");
    const { rows: superAdmins } = await pool.query("SELECT id FROM users JOIN roles ON roles.id = users.role_id WHERE roles.name = 'Super Admin' LIMIT 1");
    const creatorId = superAdmins[0]?.id;

    const user = await userRepository.create({
      full_name: fullName,
      email: email,
      password: hashedPassword,
      role_id: userRole.id,
      created_by_admin_id: creatorId,
    });

    // Auto-login
    const result = await authService.login({ email, password });
    return res.status(201).json(created(result));
  }

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    return res.json(ok(result));
  }

  async profile(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await userRepository.getById(req.user.id);
    return res.json(ok({ user }));
  }
}

export const userAuthController = new UserAuthController();
