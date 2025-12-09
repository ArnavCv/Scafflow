"use client"

import { useEffect, useState } from "react"
import PageWrapper from "@/components/layout/page-wrapper"
import SectionCard from "@/components/ui/section-card"
import TableSimple from "@/components/ui/table-simple"
import { useAuth, useProtectedPage } from "@/hooks/use-auth"
import { useApi } from "@/hooks/use-api"
import { useProjects } from "@/hooks/use-projects"
import type { Project } from "@/lib/types"

export default function AdminPage() {
  const { user } = useAuth()
  const { loading: authLoading } = useProtectedPage()
  const { call, loading } = useApi()
  const { projects } = useProjects()
  const [users, setUsers] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await call("/api/admin/users")
        setUsers(data || [])
      } catch (err: any) {
        setError(err?.message || "Failed to load users")
      }
    }
    if (user?.role === "admin") {
      void load()
    }
  }, [call, user])

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen">Checking session...</div>
  }

  if (user?.role !== "admin") {
    return <div className="flex items-center justify-center h-screen">Access denied</div>
  }

  return (
    <PageWrapper title="Admin Dashboard">
      <div className="space-y-6">
        <SectionCard title="Users (view only)">
          {loading ? (
            <p className="text-sm text-[#6F6F6F]">Loading...</p>
          ) : (
            <TableSimple
              columns={[
                { key: "name", label: "Name" },
                { key: "email", label: "Email" },
                { key: "role", label: "Role" },
                { key: "project_count", label: "Projects" },
                { key: "created_at", label: "Joined" },
              ]}
              data={users}
            />
          )}
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </SectionCard>

        <SectionCard title="Projects (all users)">
          <TableSimple
            columns={[
              { key: "name", label: "Name" },
              { key: "status", label: "Status" },
              { key: "owner_name", label: "Owner" },
              { key: "owner_email", label: "Owner Email" },
              { key: "budget_total", label: "Budget" },
              { key: "progress_percentage", label: "Progress" },
            ]}
            data={(projects as Project[]).map((p) => ({
              ...p,
              budget_total: p.budget_total ?? 0,
              progress_percentage: p.progress_percentage ?? 0,
              owner_name: p.owner_name || "Unknown",
              owner_email: p.owner_email || "",
            }))}
          />
          {projects.length === 0 && <p className="text-sm text-[#6F6F6F] mt-2">No projects yet.</p>}
        </SectionCard>
      </div>
    </PageWrapper>
  )
}
