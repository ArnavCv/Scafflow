import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { extractToken, verifyToken } from "@/lib/auth"

async function updateProjectProgress(projectId: number) {
  await query(
    `UPDATE projects
     SET progress_percentage = COALESCE(sub.avg_progress, 0),
         updated_at = CURRENT_TIMESTAMP
     FROM (
       SELECT AVG(progress_percentage)::int AS avg_progress
       FROM tasks
       WHERE project_id = $1
     ) AS sub
     WHERE projects.id = $1`,
    [projectId],
  )
}

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
      `SELECT t.* 
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE t.project_id = $1 AND (p.owner_id = $2 OR $3 = TRUE)
       ORDER BY t.created_at DESC`,
      [projectId, decoded.id, decoded.role === "admin"],
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("[v0] Get tasks error:", error)
    return NextResponse.json({ error: "Failed to get tasks" }, { status: 500 })
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
      return NextResponse.json({ error: "Admins are read-only for tasks" }, { status: 403 })
    }

    const { project_id, title, description, status, progress_percentage, assigned_to, start_date, end_date, priority } =
      await request.json()

    if (!project_id || !title) {
      return NextResponse.json({ error: "project_id and title are required" }, { status: 400 })
    }

    const projectOwner = await query("SELECT owner_id FROM projects WHERE id = $1", [project_id])
    if (projectOwner.rows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    if (projectOwner.rows[0].owner_id !== decoded.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const result = await query(
      `INSERT INTO tasks (project_id, title, description, status, progress_percentage, assigned_to, start_date, end_date, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        project_id,
        title,
        description || null,
        status || "pending",
        progress_percentage ?? 0,
        assigned_to || null,
        start_date || null,
        end_date || null,
        priority || "medium",
      ],
    )

    await updateProjectProgress(project_id)
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("[v0] Create task error:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
