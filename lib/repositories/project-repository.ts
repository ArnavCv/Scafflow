import { query } from "@/lib/db"
import type { UserEntity } from "@/lib/domain/user"
import type { Project } from "@/lib/types"

export type ProjectWithOwner = Project & {
  owner_name: string
  owner_email: string
}

export class ProjectRepository {
  async findByIdVisibleTo(id: string, user: UserEntity): Promise<ProjectWithOwner | null> {
    const isAdmin = user.isAdmin()
    const result = await query(
      `SELECT p.*, u.name AS owner_name, u.email AS owner_email
       FROM projects p
       JOIN users u ON u.id = p.owner_id
       WHERE p.id = $1 AND (p.owner_id = $2 OR $3 = TRUE)`,
      [id, user.id, isAdmin],
    )
    if (result.rows.length === 0) return null
    return result.rows[0] as ProjectWithOwner
  }

  async listVisibleTo(user: UserEntity): Promise<ProjectWithOwner[]> {
    const isAdmin = user.isAdmin()
    const result = await query(
      `SELECT p.*, u.name AS owner_name, u.email AS owner_email
       FROM projects p
       JOIN users u ON u.id = p.owner_id
       ${isAdmin ? "" : "WHERE p.owner_id = $1"}
       ORDER BY p.created_at DESC`,
      isAdmin ? [] : [user.id],
    )
    return result.rows as ProjectWithOwner[]
  }
}
