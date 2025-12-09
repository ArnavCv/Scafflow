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
      `SELECT d.*
       FROM progress_draws d
       JOIN projects p ON d.project_id = p.id
       WHERE d.project_id = $1 AND (p.owner_id = $2 OR $3 = TRUE)
       ORDER BY requested_at DESC`,
      [projectId, decoded.id, decoded.role === "admin"],
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("[v0] Get progress draws error:", error)
    return NextResponse.json({ error: "Failed to get progress draws" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get("authorization") || "")
    const decoded = token ? verifyToken(token) : null
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (decoded.role === "admin") {
      return NextResponse.json({ error: "Admins are read-only for progress draws" }, { status: 403 })
    }

    const { project_id, amount, draw_number, requested_at } = await request.json()

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
      `INSERT INTO progress_draws (project_id, draw_number, amount, requested_at)
       VALUES ($1, $2, $3, COALESCE($4, CURRENT_TIMESTAMP))
       RETURNING *`,
      [project_id, draw_number || null, amount, requested_at || null],
    )

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("[v0] Create progress draw error:", error)
    return NextResponse.json({ error: "Failed to create progress draw" }, { status: 500 })
  }
}
