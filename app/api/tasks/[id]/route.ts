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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = extractToken(request.headers.get("authorization") || "")
    const decoded = token ? verifyToken(token) : null
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (decoded.role === "admin") {
      return NextResponse.json({ error: "Admins are read-only for tasks" }, { status: 403 })
    }

    const { status, progress_percentage, title, description, priority } = await request.json()
    const result = await query(
      `UPDATE tasks 
       SET status = COALESCE($1, status),
           progress_percentage = COALESCE($2, progress_percentage),
           title = COALESCE($3, title),
           description = COALESCE($4, description),
           priority = COALESCE($5, priority),
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $6 AND project_id IN (SELECT id FROM projects WHERE owner_id = $7)
       RETURNING *`,
      [status, progress_percentage, title, description, priority, id, decoded.id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const updatedTask = result.rows[0]
    await updateProjectProgress(updatedTask.project_id)
    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error("[v0] Update task error:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}
