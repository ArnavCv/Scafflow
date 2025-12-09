import { NextResponse } from "next/server"
import { extractToken, verifyToken } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  const token = extractToken(request.headers.get("authorization") || "")
  const decoded = token ? verifyToken(token) : null

  if (!decoded || decoded.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const result = await query(
    `SELECT u.id, u.name, u.email, u.role, u.created_at, COUNT(p.id) AS project_count
     FROM users u
     LEFT JOIN projects p ON p.owner_id = u.id
     GROUP BY u.id
     ORDER BY u.created_at DESC`,
  )

  return NextResponse.json(result.rows)
}
