import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { extractToken, verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get("authorization") || "")
    const decoded = token ? verifyToken(token) : null
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projectId = request.nextUrl.searchParams.get("projectId")
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 })
    }

    const result = await query(
      `SELECT c.* 
       FROM change_orders c
       JOIN projects p ON c.project_id = p.id
       WHERE c.project_id = $1 AND (p.owner_id = $2 OR $3 = TRUE)
       ORDER BY c.created_at DESC`,
      [projectId, decoded.id, decoded.role === "admin"],
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("[v0] Get change orders error:", error)
    return NextResponse.json({ error: "Failed to get change orders" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get("authorization") || "")
    const decoded = verifyToken(token || "")

    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (decoded.role === "admin") {
      return NextResponse.json({ error: "Admins are read-only for change orders" }, { status: 403 })
    }

    const { project_id, title, description, amount } = await request.json()

    if (!project_id || !amount) {
      return NextResponse.json({ error: "project_id and amount are required" }, { status: 400 })
    }

    const projectOwner = await query("SELECT owner_id FROM projects WHERE id = $1", [project_id])
    if (projectOwner.rows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    if (projectOwner.rows[0].owner_id !== decoded.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const result = await query(
      "INSERT INTO change_orders (project_id, title, description, amount, requested_by) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [project_id, title || null, description, amount, decoded.id],
    )

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("[v0] Create change order error:", error)
    return NextResponse.json({ error: "Failed to create change order" }, { status: 500 })
  }
}
