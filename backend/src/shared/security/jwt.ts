import jwt from "jsonwebtoken";
import type { Secret, SignOptions } from "jsonwebtoken";
import { env } from "../env.js";

export type JwtPayload = {
  sub: string;
};

export function signJwt(userId: string) {
  const secret: Secret = env.JWT_SECRET;
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as any,
  };
  return jwt.sign({ sub: userId } satisfies JwtPayload, secret, options);
}

export function verifyJwt(token: string): JwtPayload {
  const payload = jwt.verify(token, env.JWT_SECRET);
  if (typeof payload !== "object" || payload === null || !("sub" in payload)) {
    throw new Error("Invalid token payload");
  }
  return payload as JwtPayload;
}
