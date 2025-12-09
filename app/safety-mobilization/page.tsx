"use client"

import { useEffect, useState } from "react"
import PageWrapper from "@/components/layout/page-wrapper"
import SectionCard from "@/components/ui/section-card"
import ChecklistItem from "@/components/ui/checklist-item"
import { useProtectedPage } from "@/hooks/use-auth"
import { useApi } from "@/hooks/use-api"
import { useProjects } from "@/hooks/use-projects"
import type { SafetyIncident } from "@/lib/types"

export default function SafetyMobilization() {
  const { user, loading: authLoading } = useProtectedPage()
  const { projects } = useProjects()
  const { call, loading } = useApi()
  const isAdmin = user?.role === "admin"
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [incidents, setIncidents] = useState<SafetyIncident[]>([])
  const [form, setForm] = useState({ description: "", severity: "medium", incident_type: "general" })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  useEffect(() => {
    if (selectedProjectId) {
      void loadIncidents(selectedProjectId)
    }
  }, [selectedProjectId])

  const loadIncidents = async (projectId: number) => {
    setError(null)
    try {
      const data = await call(`/api/safety?projectId=${projectId}`)
      setIncidents(data || [])
    } catch (err: any) {
      setError(err?.message || "Failed to load incidents")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId) return
    setError(null)
    try {
      await call("/api/safety", {
        method: "POST",
        body: JSON.stringify({
          project_id: selectedProjectId,
          severity: form.severity,
          description: form.description,
          incident_type: form.incident_type,
        }),
      })
      setForm({ description: "", severity: "medium", incident_type: "general" })
      await loadIncidents(selectedProjectId)
    } catch (err: any) {
      setError(err?.message || "Failed to create incident")
    }
  }

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen">Checking session...</div>
  }

  return (
    <PageWrapper title="Safety & Mobilization">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
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
        <SectionCard title="Record Incident">
            {isAdmin ? (
              <p className="text-sm text-[#6F6F6F]">Admins are read-only here. Use a user account to log incidents.</p>
            ) : (
              <form className="space-y-2" onSubmit={handleSubmit}>
                <textarea
                  className="w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  required
                />
                <select
                  className="w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                  value={form.severity}
                  onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={!selectedProjectId || loading}
                  className="w-full bg-[#1C7C54] text-white rounded-lg py-2 text-sm font-semibold hover:bg-[#166544] disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Add Incident"}
                </button>
              </form>
            )}
        </SectionCard>
        </div>

        <div className="lg:col-span-3">
          <SectionCard title="Incidents">
            {loading ? (
              <p className="text-sm text-[#6F6F6F]">Loading...</p>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto">
                {incidents.map((incident) => (
                  <div key={incident.id} className="border border-[rgba(0,0,0,0.08)] rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-500 text-[#0C0C0C]">{incident.description}</p>
                      <span className="text-xs text-[#6F6F6F] capitalize">{incident.severity}</span>
                    </div>
                    <p className="text-xs text-[#6F6F6F] mt-1">
                      Type: {incident.incident_type || "general"} | Reported by {incident.reported_by}
                    </p>
                  </div>
                ))}
                {incidents.length === 0 && <p className="text-sm text-[#6F6F6F]">No incidents recorded.</p>}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Daily Mobilization Checklist">
            <div className="space-y-0">
              <ChecklistItem label="Barricading Installed" defaultChecked />
              <ChecklistItem label="Signage Verified" defaultChecked />
              <ChecklistItem label="PPE Distributed" defaultChecked />
              <ChecklistItem label="Perimeter Inspection Complete" defaultChecked={false} />
              <ChecklistItem label="Emergency Equipment Check" defaultChecked />
              <ChecklistItem label="Site Drainage Verified" defaultChecked={false} />
              <ChecklistItem label="Crane Safety Inspection" defaultChecked />
              <ChecklistItem label="Fire Extinguishers Accessible" defaultChecked />
            </div>
          </SectionCard>
        </div>
      </div>
    </PageWrapper>
  )
}
