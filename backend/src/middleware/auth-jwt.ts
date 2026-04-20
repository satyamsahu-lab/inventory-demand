import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../shared/http/http-errors.js';
import { verifyJwt } from '../shared/security/jwt.js';
import { userRepository } from '../repositories/user-repository.js';

export type RequestUser = {
  id: string;
  fullName: string;
  email: string;
  role: { id: string; name: 'Super Admin' | 'Admin' | 'User' };
  createdByAdminId: string | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __requestUser: undefined;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: RequestUser;
  }
}

export async function authJwt(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.header('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError());
  }

  const token = authHeader.slice('Bearer '.length).trim();
  try {
    const payload = verifyJwt(token);
    const user = await userRepository.getById(payload.sub);
    if (!user) {
      return next(new UnauthorizedError());
    }

    req.user = {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: { id: user.role_id, name: user.role_name },
      createdByAdminId: user.created_by_admin_id
    };

    return next();
  } catch {
    return next(new UnauthorizedError());
  }
}
