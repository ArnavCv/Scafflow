export interface User {
  id: number
  email: string
  name: string
  role: "admin" | "site_engineer" | "architect" | "vendor"
  avatar_url?: string
  created_at: string
  updated_at?: string
}

export interface Project {
  id: number
  name: string
  description?: string | null
  location?: string | null
  status: string
  budget_total?: number | null
  budget_spent?: number | null
  budget_variance?: number | null
  progress_percentage?: number
  owner_name?: string
  owner_email?: string
  start_date?: string | null
  end_date?: string | null
  owner_id?: number | null
  created_at: string
  updated_at?: string
}

export interface Task {
  id: number
  project_id: number
  title: string
  status: "pending" | "in_progress" | "completed"
  progress_percentage: number
  assigned_to?: number | null
  description?: string | null
  priority?: string | null
  start_date?: string | null
  end_date?: string | null
  created_at: string
  updated_at?: string
}

export interface SafetyIncident {
  id: number
  project_id: number
  incident_type?: string | null
  severity: string
  description: string
  reported_by: number
  reported_at?: string
  status?: string
  created_at: string
}

export interface BudgetItem {
  id: number
  project_id: number
  category: string
  description?: string | null
  budget_amount: number
  spent_amount: number
  variance: number
  created_at: string
  updated_at?: string
}

export interface ChangeOrder {
  id: number
  project_id: number
  title?: string | null
  description: string
  amount: number
  status: "pending" | "approved" | "rejected"
  requested_by: number
  created_at: string
  updated_at?: string
}

export interface ProgressDraw {
  id: number
  project_id: number
  draw_number?: string | null
  amount: number
  status: "requested" | "approved" | "paid"
  requested_at?: string
  paid_at?: string | null
  created_at: string
  updated_at?: string
}
