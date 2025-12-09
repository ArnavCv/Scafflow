import jwt, { type JwtPayload } from "jsonwebtoken"
import bcryptjs from "bcryptjs"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export type AuthTokenPayload = {
  id: number
  email: string
  role: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash)
}

export function generateToken(user: AuthTokenPayload): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    if (!decoded || typeof decoded !== "object" || typeof decoded.id !== "number" || !decoded.email || !decoded.role) {
      return null
    }
    return { id: decoded.id, email: String(decoded.email), role: String(decoded.role) }
  } catch {
    return null
  }
}

export function extractToken(authHeader?: string): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null
  return authHeader.slice(7)
}
