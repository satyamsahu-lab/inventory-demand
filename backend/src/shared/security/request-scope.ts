import type { Request } from 'express';
import { resolveScopeAdminId } from './scope.js';
import { ForbiddenError } from '../http/http-errors.js';

export function getScopeAdminIdOrThrow(req: Request) {
  if (!req.user) {
    throw new ForbiddenError();
  }
  return resolveScopeAdminId({
    id: req.user.id,
    role: req.user.role,
    createdByAdminId: req.user.createdByAdminId
  });
}
