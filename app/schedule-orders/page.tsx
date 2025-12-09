"use client"

import { useEffect, useMemo, useState } from "react"
import PageWrapper from "@/components/layout/page-wrapper"
import SectionCard from "@/components/ui/section-card"
import ProgressBar from "@/components/ui/progress-bar"
import StatusPill from "@/components/ui/status-pill"
import { useProtectedPage } from "@/hooks/use-auth"
import { useProjects } from "@/hooks/use-projects"
import { useApi } from "@/hooks/use-api"
import type { Task, ChangeOrder } from "@/lib/types"

export default function ScheduleOrders() {
  const { loading: authLoading } = useProtectedPage()
  const { projects } = useProjects()
  const { call, loading } = useApi()
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  useEffect(() => {
    if (selectedProjectId) {
      void loadData(selectedProjectId)
    }
  }, [selectedProjectId])

  const loadData = async (projectId: number) => {
    setError(null)
    try {
      const [t, co] = await Promise.all([
        call(`/api/tasks?projectId=${projectId}`),
        call(`/api/change-orders?projectId=${projectId}`),
      ])
      setTasks(t || [])
      setChangeOrders(co || [])
    } catch (err: any) {
      setError(err?.message || "Failed to load schedule/change orders")
    }
  }

  const timeline = useMemo(() => {
    return [...tasks].sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""))
  }, [tasks])

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen">Checking session...</div>
  }

  return (
    <PageWrapper title="Schedule & Change Orders">
      <div className="space-y-6">
        <SectionCard title="Select Project">
          <select
            className="w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
            value={selectedProjectId ?? ""}
            onChange={(e) => setSelectedProjectId(Number(e.target.value))}
          >
            <option value="" disabled>
              Choose a project
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {projects.length === 0 && <p className="text-sm text-[#6F6F6F] mt-2">No projects yet.</p>}
        </SectionCard>

        <SectionCard title="Project Timeline">
          {loading ? (
            <p className="text-sm text-[#6F6F6F]">Loading...</p>
          ) : timeline.length === 0 ? (
            <p className="text-sm text-[#6F6F6F]">Add tasks to build a timeline.</p>
          ) : (
            <div className="space-y-3">
              {timeline.map((task) => (
                <div key={task.id}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm font-500 text-[#0C0C0C]">{task.title}</span>
                    <span className="text-xs text-[#6F6F6F]">{task.status}</span>
                  </div>
                  <ProgressBar percent={task.progress_percentage ?? 0} showLabel={false} />
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Change Orders">
          {loading ? (
            <p className="text-sm text-[#6F6F6F]">Loading...</p>
          ) : (
            <div className="space-y-1">
              {changeOrders.map((co) => (
                <div
                  key={co.id}
                  className="flex items-center justify-between p-3 border border-[rgba(0,0,0,0.08)] rounded-lg hover:bg-[#F8F8F8] transition-colors"
                >
                  <div>
                    <p className="text-sm font-500 text-[#0C0C0C]">
                      {co.title || `CO-${co.id}`} - {co.description}
                    </p>
                    <p className="text-xs text-[#6F6F6F] mt-1">{co.amount}</p>
                  </div>
                  <StatusPill status={co.status === "approved" ? "approved" : "requested"} label={co.status} />
                </div>
              ))}
              {changeOrders.length === 0 && <p className="text-sm text-[#6F6F6F]">No change orders.</p>}
            </div>
          )}
        </SectionCard>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </PageWrapper>
  )
}
