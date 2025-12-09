"use client"

import { useEffect, useState } from "react"
import PageWrapper from "@/components/layout/page-wrapper"
import SectionCard from "@/components/ui/section-card"
import StatusPill from "@/components/ui/status-pill"
import { useProtectedPage } from "@/hooks/use-auth"
import { useApi } from "@/hooks/use-api"
import { useProjects } from "@/hooks/use-projects"
import type { ProgressDraw } from "@/lib/types"

export default function ProgressDrawsPage() {
  const { user, loading: authLoading } = useProtectedPage()
  const { projects } = useProjects()
  const { call, loading } = useApi()
  const isAdmin = user?.role === "admin"
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [draws, setDraws] = useState<ProgressDraw[]>([])
  const [form, setForm] = useState({ draw_number: "", amount: "" })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  useEffect(() => {
    if (selectedProjectId) {
      void loadDraws(selectedProjectId)
    }
  }, [selectedProjectId])

  const loadDraws = async (projectId: number) => {
    setError(null)
    try {
      const data = await call(`/api/progress-draws?projectId=${projectId}`)
      setDraws(data || [])
    } catch (err: any) {
      setError(err?.message || "Failed to load progress draws")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId) return
    setError(null)
    try {
      await call("/api/progress-draws", {
        method: "POST",
        body: JSON.stringify({
          project_id: selectedProjectId,
          draw_number: form.draw_number,
          amount: Number(form.amount || 0),
        }),
      })
      setForm({ draw_number: "", amount: "" })
      await loadDraws(selectedProjectId)
    } catch (err: any) {
      setError(err?.message || "Failed to create progress draw")
    }
  }

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen">Checking session...</div>
  }

  return (
    <PageWrapper title="Progress Draws">
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

        <SectionCard title="Request Draw">
          {isAdmin ? (
            <p className="text-sm text-[#6F6F6F]">Admins are read-only here. Use a user account to request draws.</p>
          ) : (
            <form className="space-y-2" onSubmit={handleSubmit}>
              <input
                className="w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                placeholder="Draw number"
                value={form.draw_number}
                onChange={(e) => setForm((f) => ({ ...f, draw_number: e.target.value }))}
              />
              <input
                className="w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                placeholder="Amount"
                type="number"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                required
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={!selectedProjectId || loading}
                className="bg-[#1C7C54] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#166544] disabled:opacity-60"
              >
                {loading ? "Saving..." : "Submit Draw"}
              </button>
            </form>
          )}
        </SectionCard>

        <SectionCard title="Draw Requests">
          {loading ? (
            <p className="text-sm text-[#6F6F6F]">Loading...</p>
          ) : (
            <div className="space-y-2">
              {draws.map((draw) => (
                <div key={draw.id} className="flex items-center justify-between p-3 border border-[rgba(0,0,0,0.08)] rounded-lg">
                  <div>
                    <p className="text-sm font-500 text-[#0C0C0C]">{draw.draw_number || `Draw ${draw.id}`}</p>
                    <p className="text-xs text-[#6F6F6F]">Amount: {draw.amount}</p>
                  </div>
                  <StatusPill status={draw.status === "paid" ? "paid" : "requested"} label={draw.status} />
                </div>
              ))}
              {draws.length === 0 && <p className="text-sm text-[#6F6F6F]">No draws yet.</p>}
            </div>
          )}
        </SectionCard>
      </div>
    </PageWrapper>
  )
}
