"use client"

import { useEffect, useState } from "react"
import PageWrapper from "@/components/layout/page-wrapper"
import SectionCard from "@/components/ui/section-card"
import TableSimple from "@/components/ui/table-simple"
import { useProtectedPage } from "@/hooks/use-auth"
import { useProjects } from "@/hooks/use-projects"
import { useApi } from "@/hooks/use-api"
import type { BudgetItem } from "@/lib/types"

export default function BudgetCosts() {
  const { user, loading: authLoading } = useProtectedPage()
  const { projects } = useProjects()
  const { call, loading } = useApi()
  const isAdmin = user?.role === "admin"
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [budgetData, setBudgetData] = useState<BudgetItem[]>([])
  const [form, setForm] = useState({ category: "", budget_amount: "", description: "" })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  useEffect(() => {
    if (selectedProjectId) {
      void loadBudget(selectedProjectId)
    }
  }, [selectedProjectId])

  const loadBudget = async (projectId: number) => {
    setError(null)
    try {
      const data = await call(`/api/budget?projectId=${projectId}`)
      setBudgetData(data || [])
    } catch (err: any) {
      setError(err?.message || "Failed to load budget data")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId) return
    setError(null)
    try {
      await call("/api/budget", {
        method: "POST",
        body: JSON.stringify({
          project_id: selectedProjectId,
          category: form.category,
          description: form.description,
          budget_amount: Number(form.budget_amount || 0),
        }),
      })
      setForm({ category: "", budget_amount: "", description: "" })
      await loadBudget(selectedProjectId)
    } catch (err: any) {
      setError(err?.message || "Failed to create budget item")
    }
  }

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen">Checking session...</div>
  }

  return (
    <PageWrapper title="Budget & Costs">
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

        <SectionCard title="Add Budget Item">
          {isAdmin ? (
            <p className="text-sm text-[#6F6F6F]">Admins are read-only here. Use a user account to add budget items.</p>
          ) : (
            <form className="space-y-2" onSubmit={handleSubmit}>
              <input
                className="w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                required
              />
              <input
                className="w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                placeholder="Budget amount"
                type="number"
                value={form.budget_amount}
                onChange={(e) => setForm((f) => ({ ...f, budget_amount: e.target.value }))}
                required
              />
              <textarea
                className="w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={!selectedProjectId || loading}
                className="bg-[#1C7C54] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#166544] disabled:opacity-60"
              >
                {loading ? "Saving..." : "Add Item"}
              </button>
            </form>
          )}
        </SectionCard>

        <SectionCard title="Budget Breakdown">
          {loading ? (
            <p className="text-sm text-[#6F6F6F]">Loading...</p>
          ) : (
            <TableSimple
              columns={[
                { key: "category", label: "Category" },
                { key: "budget_amount", label: "Budget" },
                { key: "spent_amount", label: "Spent" },
                { key: "variance", label: "Variance" },
              ]}
              data={budgetData.map((b) => ({
                ...b,
                budget_amount: b.budget_amount ?? 0,
                spent_amount: b.spent_amount ?? 0,
                variance: b.variance ?? 0,
              }))}
            />
          )}
        </SectionCard>
      </div>
    </PageWrapper>
  )
}
