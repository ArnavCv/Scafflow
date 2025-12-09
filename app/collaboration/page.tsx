"use client"

import { useEffect, useMemo, useState } from "react"
import PageWrapper from "@/components/layout/page-wrapper"
import SectionCard from "@/components/ui/section-card"
import { useProtectedPage } from "@/hooks/use-auth"
import { useProjects } from "@/hooks/use-projects"
import { useApi } from "@/hooks/use-api"
import type { Task, SafetyIncident, ChangeOrder, ProgressDraw } from "@/lib/types"

type FeedItem = {
  id: string
  title: string
  detail: string
  timestamp: string
  kind: "task" | "safety" | "change" | "draw"
}

export default function Collaboration() {
  const { loading: authLoading } = useProtectedPage()
  const { projects } = useProjects()
  const { call, loading } = useApi()
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [safety, setSafety] = useState<SafetyIncident[]>([])
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([])
  const [draws, setDraws] = useState<ProgressDraw[]>([])
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
      const [t, s, co, d] = await Promise.all([
        call(`/api/tasks?projectId=${projectId}`),
        call(`/api/safety?projectId=${projectId}`),
        call(`/api/change-orders?projectId=${projectId}`),
        call(`/api/progress-draws?projectId=${projectId}`),
      ])
      setTasks(t || [])
      setSafety(s || [])
      setChangeOrders(co || [])
      setDraws(d || [])
    } catch (err: any) {
      setError(err?.message || "Failed to load collaboration feed")
    }
  }

  const feed: FeedItem[] = useMemo(() => {
    const items: FeedItem[] = []
    tasks.forEach((t) =>
      items.push({
        id: `task-${t.id}`,
        title: `Task: ${t.title}`,
        detail: `Status ${t.status}, progress ${t.progress_percentage ?? 0}%`,
        timestamp: t.updated_at || t.created_at || "",
        kind: "task",
      }),
    )
    safety.forEach((s) =>
      items.push({
        id: `safety-${s.id}`,
        title: `Safety: ${s.incident_type || "incident"}`,
        detail: s.description,
        timestamp: s.created_at || s.reported_at || "",
        kind: "safety",
      }),
    )
    changeOrders.forEach((c) =>
      items.push({
        id: `change-${c.id}`,
        title: `Change order ${c.title || c.id}`,
        detail: `${c.status} - ${c.description}`,
        timestamp: c.updated_at || c.created_at || "",
        kind: "change",
      }),
    )
    draws.forEach((d) =>
      items.push({
        id: `draw-${d.id}`,
        title: `Progress draw ${d.draw_number || d.id}`,
        detail: `${d.status} - Amount ${d.amount}`,
        timestamp: d.updated_at || d.created_at || "",
        kind: "draw",
      }),
    )
    return items.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""))
  }, [changeOrders, draws, safety, tasks])

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen">Checking session...</div>
  }

  return (
    <PageWrapper title="Collaboration">
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

        <SectionCard title="Activity Feed">
          {loading ? (
            <p className="text-sm text-[#6F6F6F]">Loading...</p>
          ) : (
            <div className="space-y-2">
              {feed.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 border border-[rgba(0,0,0,0.08)] rounded-lg hover:bg-[#F8F8F8] transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-[#E6F3EC] flex items-center justify-center flex-shrink-0 text-xs">
                    <span className="font-semibold text-[#1C7C54]">{item.kind[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-500 text-[#0C0C0C]">{item.title}</p>
                        <p className="text-xs text-[#6F6F6F]">{item.detail}</p>
                      </div>
                      <p className="text-xs text-[#6F6F6F] flex-shrink-0">
                        {item.timestamp ? new Date(item.timestamp).toLocaleString() : "recent"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {feed.length === 0 && <p className="text-sm text-[#6F6F6F]">No activity yet.</p>}
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          )}
        </SectionCard>
      </div>
    </PageWrapper>
  )
}
