import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface JwtPayload {
  sub: string;       // user id
  username: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}

/** 从 "Bearer xxx" 提取 token */
export function extractBearer(authHeader?: string): string | null {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

import type { Request, Response, NextFunction } from 'express';

/** Express 中间件：校验 JWT */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = extractBearer(req.headers.authorization);
  if (!token) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: '缺少 token' });
    return;
  }
  try {
    const payload = verifyToken(token);
    (req as unknown as { user: JwtPayload }).user = payload;
    next();
  } catch {
    res.status(401).json({ code: 'INVALID_TOKEN', message: 'token 无效或已过期' });
  }
}
