"use client"

import { useEffect, useState } from "react"
import PageWrapper from "@/components/layout/page-wrapper"
import SectionCard from "@/components/ui/section-card"
import StatusPill from "@/components/ui/status-pill"
import { useProtectedPage } from "@/hooks/use-auth"
import { useApi } from "@/hooks/use-api"
import { useProjects } from "@/hooks/use-projects"
import type { ChangeOrder } from "@/lib/types"

export default function ChangeOrdersPage() {
  const { user, loading: authLoading } = useProtectedPage()
  const { projects } = useProjects()
  const { call, loading } = useApi()
  const isAdmin = user?.role === "admin"
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([])
  const [form, setForm] = useState({ title: "", description: "", amount: "" })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  useEffect(() => {
    if (selectedProjectId) {
      void loadChangeOrders(selectedProjectId)
    }
  }, [selectedProjectId])

  const loadChangeOrders = async (projectId: number) => {
    setError(null)
    try {
      const data = await call(`/api/change-orders?projectId=${projectId}`)
      setChangeOrders(data || [])
    } catch (err: any) {
      setError(err?.message || "Failed to load change orders")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId) return
    setError(null)
    try {
      await call("/api/change-orders", {
        method: "POST",
        body: JSON.stringify({
          project_id: selectedProjectId,
          title: form.title,
          description: form.description,
          amount: Number(form.amount || 0),
        }),
      })
      setForm({ title: "", description: "", amount: "" })
      await loadChangeOrders(selectedProjectId)
    } catch (err: any) {
      setError(err?.message || "Failed to create change order")
    }
  }

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen">Checking session...</div>
  }

  return (
    <PageWrapper title="Change Orders">
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

        <SectionCard title="Create Change Order">
          {isAdmin ? (
            <p className="text-sm text-[#6F6F6F]">Admins are read-only here. Use a user account to add change orders.</p>
          ) : (
            <form className="space-y-2" onSubmit={handleSubmit}>
              <input
                className="w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
              <textarea
                className="w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
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
                {loading ? "Saving..." : "Create Change Order"}
              </button>
            </form>
          )}
        </SectionCard>

        <SectionCard title="Change Orders">
          {loading ? (
            <p className="text-sm text-[#6F6F6F]">Loading...</p>
          ) : (
            <div className="space-y-2">
              {changeOrders.map((order) => (
                <div key={order.id} className="border border-[rgba(0,0,0,0.08)] rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-500 text-[#0C0C0C]">{order.title || "Change Order"}</p>
                      <p className="text-xs text-[#6F6F6F]">{order.description}</p>
                    </div>
                    <StatusPill status={order.status === "approved" ? "paid" : "requested"} label={order.status} />
                  </div>
                  <p className="text-xs text-[#6F6F6F] mt-1">Amount: {order.amount}</p>
                </div>
              ))}
              {changeOrders.length === 0 && <p className="text-sm text-[#6F6F6F]">No change orders yet.</p>}
            </div>
          )}
        </SectionCard>
      </div>
    </PageWrapper>
  )
}
