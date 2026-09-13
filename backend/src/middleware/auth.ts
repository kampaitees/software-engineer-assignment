import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'
import { env } from '../config/env.js'
import { AppError } from '../utils/errors.js'

declare global { namespace Express { interface Request { userId?: string } } }

export function signSession(userId: string) { return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: '7d' }) }

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.session
    if (!token) throw new AppError(401, 'UNAUTHENTICATED', 'Please sign in.')
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload
    if (!payload.sub) throw new Error('invalid')
    req.userId = payload.sub
    next()
  } catch { next(new AppError(401, 'INVALID_SESSION', 'Your session is invalid or expired.')) }
}
