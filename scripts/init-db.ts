import pool, { initializeDatabase, query } from "../lib/db"
import { hashPassword } from "../lib/auth"

const esc = (val: string | null | undefined) => (val ? `'${val.replace(/'/g, "''")}'` : "NULL")

type SeedUser = { name: string; email: string; password: string; role: string }
type SeedProject = {
  name: string
  ownerEmail: string
  budget?: number
  status?: string
  progress?: number
  location?: string
  description?: string
  start_date?: string
  end_date?: string
}

function calcBudgetSpent(budgetTotal: number, progress: number) {
  const floor = budgetTotal * 0.2
  const estimate = budgetTotal * Math.min(0.95, progress / 100 * 0.9)
  return Math.max(floor, Math.round(estimate))
}

async function upsertUser(user: SeedUser) {
  const existing = await query("SELECT id FROM users WHERE email = $1", [user.email])
  if (existing.rows.length > 0) {
    return existing.rows[0].id as number
  }
  const password_hash = await hashPassword(user.password)
  const res = await query(
    "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
    [user.name, user.email, password_hash, user.role],
  )
  return res.rows[0].id as number
}

async function upsertProject(project: SeedProject, ownerId: number) {
  const budgetTotal = project.budget ?? 100000
  const progress = project.progress ?? 0
  const budgetSpent = calcBudgetSpent(budgetTotal, progress)
  const variance = budgetTotal - budgetSpent

  const existing = await query("SELECT id, owner_id FROM projects WHERE name = $1", [project.name])
  if (existing.rows.length > 0) {
    const row = existing.rows[0]
    // Simplify seeding: replace existing row to avoid type inference issues on updates
    await query("DELETE FROM projects WHERE id = $1", [row.id])
  }

  const statusLiteral = esc(project.status || "active")
  const locationLiteral = esc(project.location || null)
  const descriptionLiteral = esc(project.description || null)
  const startDateLiteral = project.start_date ? `'${project.start_date}'::date` : "NULL"
  const endDateLiteral = project.end_date ? `'${project.end_date}'::date` : "NULL"

  const insertSql = `
    INSERT INTO projects (name, status, budget_total, budget_spent, budget_variance, progress_percentage, owner_id, location, description, start_date, end_date)
    VALUES (${esc(project.name)}, ${statusLiteral}, ${budgetTotal}, ${budgetSpent}, ${variance}, ${progress}, ${ownerId}, ${locationLiteral}, ${descriptionLiteral}, ${startDateLiteral}, ${endDateLiteral})
    RETURNING id
  `

  const res = await query(insertSql)
  return res.rows[0].id as number
}

function buildTaskSeeds(progress: number) {
  return [
    { title: "Mobilization & Site Prep", status: "completed", progress: 100, createdAgo: 140, updatedAgo: 120 },
    {
      title: "Foundation & Footings",
      status: progress >= 40 ? "in_progress" : "pending",
      progress: Math.max(25, Math.min(85, progress - 5)),
      createdAgo: 110,
      updatedAgo: 60,
    },
    {
      title: "Structural Frame",
      status: progress >= 55 ? "in_progress" : "pending",
      progress: Math.max(15, Math.min(80, progress - 15)),
      createdAgo: 85,
      updatedAgo: 35,
    },
    {
      title: "MEP Rough-ins",
      status: progress >= 65 ? "in_progress" : "pending",
      progress: Math.max(10, Math.min(70, progress - 30)),
      createdAgo: 60,
      updatedAgo: 20,
    },
    {
      title: "Interiors & Finishes",
      status: progress >= 80 ? "in_progress" : "pending",
      progress: Math.max(5, Math.min(60, progress - 45)),
      createdAgo: 40,
      updatedAgo: 10,
    },
    {
      title: "Commissioning",
      status: progress >= 90 ? "in_progress" : "pending",
      progress: Math.max(0, Math.min(40, progress - 60)),
      createdAgo: 25,
      updatedAgo: 5,
    },
  ]
}

async function seedData() {
  const users: SeedUser[] = [
    { name: "Scafflow Admin", email: "admin@scafflow.com", password: "Scafflow1234", role: "admin" },
    { name: "Alice Foreman", email: "alice@example.com", password: "Password123!", role: "site_engineer" },
    { name: "Bob Architect", email: "bob@example.com", password: "Password123!", role: "architect" },
    { name: "Charlie Vendor", email: "charlie@example.com", password: "Password123!", role: "vendor" },
    { name: "Dana Engineer", email: "dana@example.com", password: "Password123!", role: "site_engineer" },
    { name: "Evan PM", email: "evan@example.com", password: "Password123!", role: "admin" },
    { name: "Fiona Safety", email: "fiona@example.com", password: "Password123!", role: "site_engineer" },
    { name: "Gary Budget", email: "gary@example.com", password: "Password123!", role: "site_engineer" },
    { name: "Hana Ops", email: "hana@example.com", password: "Password123!", role: "site_engineer" },
    { name: "Ivan Planner", email: "ivan@example.com", password: "Password123!", role: "site_engineer" },
    { name: "Jade Vendor", email: "jade@example.com", password: "Password123!", role: "vendor" },
  ]

  const userIdByEmail: Record<string, number> = {}
  for (const u of users) {
    const id = await upsertUser(u)
    userIdByEmail[u.email] = id
  }

  const projects: SeedProject[] = [
    {
      name: "Central Tower",
      ownerEmail: "alice@example.com",
      budget: 5000000,
      progress: 68,
      status: "active",
      location: "Downtown CBD",
      description: "45-story mixed-use tower with retail podium",
      start_date: "2024-01-15",
      end_date: "2025-12-01",
    },
    {
      name: "Harbor Mall",
      ownerEmail: "bob@example.com",
      budget: 3200000,
      progress: 62,
      status: "active",
      location: "Harborfront",
      description: "Waterfront retail center with food court",
      start_date: "2024-02-10",
      end_date: "2025-06-30",
    },
    {
      name: "Lakeside Villas",
      ownerEmail: "dana@example.com",
      budget: 2100000,
      progress: 42,
      status: "active",
      location: "Lakeside District",
      description: "Townhome cluster with shared amenities",
      start_date: "2024-03-05",
      end_date: "2025-04-30",
    },
    {
      name: "Metro Line Depot",
      ownerEmail: "evan@example.com",
      budget: 7500000,
      progress: 28,
      status: "planning",
      location: "East Rail Yard",
      description: "Maintenance depot and stabling yard for new metro line",
      start_date: "2024-05-01",
      end_date: "2026-03-31",
    },
    {
      name: "Solar Farm A",
      ownerEmail: "hana@example.com",
      budget: 1800000,
      progress: 58,
      status: "active",
      location: "North Ridge",
      description: "60MW solar installation with battery storage",
      start_date: "2024-01-20",
      end_date: "2024-12-15",
    },
    {
      name: "Distribution Center",
      ownerEmail: "gary@example.com",
      budget: 2600000,
      progress: 39,
      status: "active",
      location: "Logistics Park",
      description: "Automated fulfillment center with cold storage",
      start_date: "2024-04-02",
      end_date: "2025-02-28",
    },
    {
      name: "Sports Arena",
      ownerEmail: "ivan@example.com",
      budget: 4300000,
      progress: 22,
      status: "active",
      location: "Riverfront",
      description: "Indoor arena with retractable roof",
      start_date: "2024-06-01",
      end_date: "2026-01-15",
    },
    {
      name: "City Library Annex",
      ownerEmail: "alice@example.com",
      budget: 1500000,
      progress: 74,
      status: "active",
      location: "Civic Center",
      description: "Learning commons and community space",
      start_date: "2023-11-10",
      end_date: "2024-09-30",
    },
    {
      name: "Tech Park Phase 2",
      ownerEmail: "bob@example.com",
      budget: 5200000,
      progress: 34,
      status: "active",
      location: "Innovation District",
      description: "Office labs and R&D blocks with data center",
      start_date: "2024-05-15",
      end_date: "2025-11-30",
    },
    {
      name: "Harbor Residences",
      ownerEmail: "dana@example.com",
      budget: 2800000,
      progress: 48,
      status: "active",
      location: "Harborfront",
      description: "Waterfront residential tower with marina access",
      start_date: "2024-02-01",
      end_date: "2025-08-31",
    },
  ]

  for (const p of projects) {
    const ownerId = userIdByEmail[p.ownerEmail]
    if (!ownerId) continue
    const projectId = await upsertProject(p, ownerId)

    const taskSeeds = buildTaskSeeds(p.progress ?? 0)
    for (const task of taskSeeds) {
      await query(`
        INSERT INTO tasks (project_id, title, status, progress_percentage, assigned_to, created_at, updated_at)
        SELECT ${projectId}, ${esc(task.title)}, ${esc(task.status)}, ${task.progress}, ${ownerId},
               NOW() - INTERVAL '${task.createdAgo} days', NOW() - INTERVAL '${task.updatedAgo} days'
        WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE project_id = ${projectId} AND title = ${esc(task.title)})
      `)
    }

    const budgetSeeds = [
      { category: "Concrete", description: "Structural concrete and formwork", pct: 0.18, spentPct: 0.12 },
      { category: "Steel & Framing", description: "Rebar, steel, bracing", pct: 0.22, spentPct: 0.14 },
      { category: "MEP", description: "Electrical, plumbing, HVAC rough-ins", pct: 0.2, spentPct: 0.1 },
      { category: "Interiors", description: "Partitions, finishes, joinery", pct: 0.16, spentPct: 0.08 },
      { category: "Siteworks", description: "Landscaping and paving", pct: 0.08, spentPct: 0.03 },
      { category: "Contingency", description: "Risk allowance", pct: 0.06, spentPct: 0.01 },
    ]

    for (const item of budgetSeeds) {
      const budget_amount = Math.round((p.budget ?? 100000) * item.pct)
      const spent_amount = Math.round(budget_amount * item.spentPct)
      const variance = budget_amount - spent_amount
      await query(`
        INSERT INTO budget_items (project_id, category, description, budget_amount, spent_amount, variance, created_at, updated_at)
        SELECT ${projectId}, ${esc(item.category)}, ${esc(item.description)}, ${budget_amount}, ${spent_amount}, ${variance},
               NOW() - INTERVAL '45 days', NOW() - INTERVAL '7 days'
        WHERE NOT EXISTS (SELECT 1 FROM budget_items WHERE project_id = ${projectId} AND category = ${esc(item.category)})
      `)
    }

    const safetySeeds = [
      {
        description: "PPE reminder near tower crane",
        severity: "low",
        incident_type: "general",
        status: "open",
        createdAgo: 21,
      },
      {
        description: "Scaffold inspection completed",
        severity: "medium",
        incident_type: "inspection",
        status: "closed",
        createdAgo: 9,
      },
    ]

    for (const s of safetySeeds) {
      await query(`
        INSERT INTO safety_incidents (project_id, incident_type, severity, description, reported_by, status, created_at, reported_at)
        SELECT ${projectId}, ${esc(s.incident_type)}, ${esc(s.severity)}, ${esc(s.description)}, ${ownerId}, ${esc(s.status)},
               NOW() - INTERVAL '${s.createdAgo} days', NOW() - INTERVAL '${s.createdAgo} days'
        WHERE NOT EXISTS (SELECT 1 FROM safety_incidents WHERE project_id = ${projectId} AND description = ${esc(s.description)})
      `)
    }

    const changeOrders = [
      {
        title: "Spec Update",
        description: "Material spec change after consultant review",
        amount: 25000,
        status: "pending",
        createdAgo: 18,
        updatedAgo: 18,
      },
      {
        title: "Facade Addendum",
        description: "Additional scope for facade lighting",
        amount: 48000,
        status: "approved",
        createdAgo: 30,
        updatedAgo: 10,
      },
    ]

    for (const co of changeOrders) {
      await query(`
        INSERT INTO change_orders (project_id, title, description, amount, status, requested_by, created_at, updated_at)
        SELECT ${projectId}, ${esc(co.title)}, ${esc(co.description)}, ${co.amount}, ${esc(co.status)}, ${ownerId},
               NOW() - INTERVAL '${co.createdAgo} days', NOW() - INTERVAL '${co.updatedAgo} days'
        WHERE NOT EXISTS (SELECT 1 FROM change_orders WHERE project_id = ${projectId} AND title = ${esc(co.title)})
      `)
    }

    const draws = [
      { draw_number: "PD-01", amount: 150000, status: "paid", requestedAgo: 90, updatedAgo: 60 },
      { draw_number: "PD-02", amount: 110000, status: "approved", requestedAgo: 45, updatedAgo: 20 },
      { draw_number: "PD-03", amount: 95000, status: "requested", requestedAgo: 10, updatedAgo: 10 },
    ]

    for (const d of draws) {
      await query(`
        INSERT INTO progress_draws (project_id, draw_number, amount, status, requested_at, created_at, updated_at)
        SELECT ${projectId}, ${esc(d.draw_number)}, ${d.amount}, ${esc(d.status)},
               NOW() - INTERVAL '${d.requestedAgo} days', NOW() - INTERVAL '${d.requestedAgo} days', NOW() - INTERVAL '${d.updatedAgo} days'
        WHERE NOT EXISTS (SELECT 1 FROM progress_draws WHERE project_id = ${projectId} AND draw_number = ${esc(d.draw_number)})
      `)
    }
  }
}

async function main() {
  try {
    console.log("Initializing database...")
    await initializeDatabase()
    console.log("Seeding data...")
    await seedData()
    console.log("Database initialized successfully")
  } catch (error) {
    console.error("Database initialization failed:", error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
