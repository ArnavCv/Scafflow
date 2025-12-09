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
      `SELECT b.* 
       FROM budget_items b
       JOIN projects p ON b.project_id = p.id
       WHERE b.project_id = $1 AND (p.owner_id = $2 OR $3 = TRUE)`,
      [projectId, decoded.id, decoded.role === "admin"],
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("[v0] Get budget error:", error)
    return NextResponse.json({ error: "Failed to get budget" }, { status: 500 })
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
      return NextResponse.json({ error: "Admins are read-only for budget items" }, { status: 403 })
    }

    const { project_id, category, description, budget_amount, spent_amount } = await request.json()

    if (!project_id || !category) {
      return NextResponse.json({ error: "project_id and category are required" }, { status: 400 })
    }

    const projectOwner = await query("SELECT owner_id FROM projects WHERE id = $1", [project_id])
    if (projectOwner.rows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    if (projectOwner.rows[0].owner_id !== decoded.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const result = await query(
      `INSERT INTO budget_items (project_id, category, description, budget_amount, spent_amount, variance)
       VALUES ($1, $2, $3, $4, COALESCE($5, 0), COALESCE($4, 0) - COALESCE($5, 0))
       RETURNING *`,
      [project_id, category, description || null, budget_amount ?? 0, spent_amount ?? 0],
    )

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("[v0] Create budget item error:", error)
    return NextResponse.json({ error: "Failed to create budget item" }, { status: 500 })
  }
}
