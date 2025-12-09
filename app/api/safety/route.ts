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
      `SELECT s.* 
       FROM safety_incidents s
       JOIN projects p ON s.project_id = p.id
       WHERE s.project_id = $1 AND (p.owner_id = $2 OR $3 = TRUE)
       ORDER BY reported_at DESC`,
      [projectId, decoded.id, decoded.role === "admin"],
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("[v0] Get safety incidents error:", error)
    return NextResponse.json({ error: "Failed to get incidents" }, { status: 500 })
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
      return NextResponse.json({ error: "Admins are read-only for safety incidents" }, { status: 403 })
    }

    const { project_id, severity, description, incident_type, status } = await request.json()

    if (!project_id || !severity || !description) {
      return NextResponse.json({ error: "project_id, severity and description are required" }, { status: 400 })
    }

    const projectOwner = await query("SELECT owner_id FROM projects WHERE id = $1", [project_id])
    if (projectOwner.rows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    if (projectOwner.rows[0].owner_id !== decoded.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const result = await query(
      `INSERT INTO safety_incidents (project_id, incident_type, severity, description, reported_by, status)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'open')) RETURNING *`,
      [project_id, incident_type || "general", severity, description, decoded.id, status],
    )

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("[v0] Create safety incident error:", error)
    return NextResponse.json({ error: "Failed to create incident" }, { status: 500 })
  }
}
