"use client"

import { useEffect, useState } from "react"
import PageWrapper from "@/components/layout/page-wrapper"
import SectionCard from "@/components/ui/section-card"
import StatusPill from "@/components/ui/status-pill"
import { useProtectedPage } from "@/hooks/use-auth"
import { useApi } from "@/hooks/use-api"
import { useProjects } from "@/hooks/use-projects"
import type { Task } from "@/lib/types"

export default function ExecutionWorkflow() {
  const { user, loading: authLoading } = useProtectedPage()
  const { projects } = useProjects()
  const { call, loading } = useApi()
  const isAdmin = user?.role === "admin"
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [form, setForm] = useState({ title: "", status: "pending" })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  useEffect(() => {
    if (selectedProjectId) {
      void loadTasks(selectedProjectId)
    }
  }, [selectedProjectId])

  const loadTasks = async (projectId: number) => {
    setError(null)
    try {
      const data = await call(`/api/tasks?projectId=${projectId}`)
      setTasks(data || [])
    } catch (err: any) {
      setError(err?.message || "Failed to load tasks")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId) return
    setError(null)
    try {
      await call("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          project_id: selectedProjectId,
          title: form.title,
          status: form.status,
        }),
      })
      setForm({ title: "", status: "pending" })
      await loadTasks(selectedProjectId)
    } catch (err: any) {
      setError(err?.message || "Failed to create task")
    }
  }

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen">Checking session...</div>
  }

  return (
    <PageWrapper title="Execution Workflow">
      <div className="space-y-4">
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

        <SectionCard title="Create Task">
          {isAdmin ? (
            <p className="text-sm text-[#6F6F6F]">Admins are read-only here. Use a user account to add tasks.</p>
          ) : (
            <>
              <form className="flex flex-col sm:flex-row gap-2 mb-2" onSubmit={handleSubmit}>
                <input
                  className="flex-1 border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                  placeholder="Task title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
                <select
                  className="border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <button
                  type="submit"
                  disabled={!selectedProjectId || loading}
                  className="bg-[#1C7C54] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#166544] disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Add Task"}
                </button>
              </form>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </>
          )}
        </SectionCard>

        <SectionCard title="Task Status List">
          {loading ? (
            <p className="text-sm text-[#6F6F6F]">Loading...</p>
          ) : (
            <div className="space-y-1">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 border border-[rgba(0,0,0,0.08)] rounded-lg hover:bg-[#F8F8F8] transition-colors"
                >
                  <div>
                    <p className="text-sm font-500 text-[#0C0C0C]">{task.title}</p>
                    <p className="text-xs text-[#6F6F6F]">Progress: {task.progress_percentage ?? 0}%</p>
                  </div>
                  <StatusPill
                    status={
                      task.status === "completed"
                        ? "completed"
                        : task.status === "pending"
                          ? "pending"
                          : "in-progress"
                    }
                    label={task.status}
                  />
                </div>
              ))}
              {tasks.length === 0 && <p className="text-sm text-[#6F6F6F]">No tasks yet.</p>}
            </div>
          )}
        </SectionCard>
      </div>
    </PageWrapper>
  )
}
