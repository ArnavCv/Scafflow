import type { NextRequest } from "next/server"
import { extractToken, verifyToken } from "@/lib/auth"
import { UserEntity } from "@/lib/domain/user"
import { ProjectRepository, type ProjectWithOwner } from "@/lib/repositories/project-repository"
import { validateProjectData } from "@/lib/validation"
import { query } from "@/lib/db"

export class ProjectService {
  private readonly repo = new ProjectRepository()

  private async getUserFromRequest(request: NextRequest): Promise<UserEntity | null> {
    const token = extractToken(request.headers.get("authorization") || "")
    const decoded = token ? verifyToken(token) : null
    if (!decoded) return null

    const result = await query("SELECT id, email, name, role FROM users WHERE id = $1", [decoded.id])
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return new UserEntity(row.id, row.name, row.email, row.role as any)
  }

  async list(request: NextRequest) {
    const user = await this.getUserFromRequest(request)
    if (!user) return { error: "Unauthorized", status: 401 as const }
    const projects = await this.repo.listVisibleTo(user)
    return { projects }
  }

  async get(request: NextRequest, id: string) {
    const user = await this.getUserFromRequest(request)
    if (!user) return { error: "Unauthorized", status: 401 as const }
    const project = await this.repo.findByIdVisibleTo(id, user)
    if (!project) return { error: "Project not found", status: 404 as const }
    return { project }
  }

  async create(request: NextRequest) {
    const user = await this.getUserFromRequest(request)
    if (!user) return { error: "Unauthorized", status: 401 as const }
    if (user.isAdmin()) return { error: "Admins are read-only for project data", status: 403 as const }
    const data = await request.json()
    const validation = validateProjectData(data)
    if (!validation.valid) return { error: "Invalid project data", status: 400 as const }

    const result = await query(
      `INSERT INTO projects (name, description, location, budget_total, budget_spent, budget_variance, start_date, end_date, owner_id)
       VALUES ($1, $2, $3, $4, 0, 0, $5, $6, $7)
       RETURNING *`,
      [
        data.name,
        data.description || null,
        data.location || null,
        data.budget_total ?? null,
        data.start_date || null,
        data.end_date || null,
        user.id,
      ],
    )
    const inserted = result.rows[0] as ProjectWithOwner
    return {
      project: {
        ...inserted,
        owner_name: user.name,
        owner_email: user.email,
      },
    }
  }

  async update(request: NextRequest, id: string) {
    const user = await this.getUserFromRequest(request)
    if (!user) return { error: "Unauthorized", status: 401 as const }
    if (user.isAdmin()) return { error: "Admins are read-only for project data", status: 403 as const }
    const existing = await this.repo.findByIdVisibleTo(id, user)
    if (!existing) return { error: "Project not found", status: 404 as const }

    const data = await request.json()
    await query(
      `UPDATE projects 
       SET name = COALESCE($1, name),
           status = COALESCE($2, status),
           budget_spent = COALESCE($3, budget_spent),
           budget_total = COALESCE($4, budget_total),
           budget_variance = COALESCE($4, budget_total) - COALESCE($3, budget_spent),
           progress_percentage = COALESCE($5, progress_percentage),
           description = COALESCE($6, description),
           location = COALESCE($7, location),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [
        data.name,
        data.status,
        data.budget_spent,
        data.budget_total,
        data.progress_percentage,
        data.description,
        data.location,
        id,
      ],
    )
    const refreshed = await this.repo.findByIdVisibleTo(id, user)
    if (!refreshed) return { error: "Project not found", status: 404 as const }
    return { project: refreshed }
  }
}
