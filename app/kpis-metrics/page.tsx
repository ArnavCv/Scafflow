"use client"

import { useEffect, useMemo, useState } from "react"
import PageWrapper from "@/components/layout/page-wrapper"
import MetricCard from "@/components/ui/metric-card"
import SectionCard from "@/components/ui/section-card"
import ProgressBar from "@/components/ui/progress-bar"
import { TrendingUp, Activity, Users, Target } from "lucide-react"
import { useProtectedPage } from "@/hooks/use-auth"
import { useProjects } from "@/hooks/use-projects"
import { useApi } from "@/hooks/use-api"
import type { Task, BudgetItem, ChangeOrder, ProgressDraw } from "@/lib/types"

export default function KPIsMetrics() {
  const { loading: authLoading } = useProtectedPage()
  const { projects } = useProjects()
  const { call, loading } = useApi()
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [budget, setBudget] = useState<BudgetItem[]>([])
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([])
  const [draws, setDraws] = useState<ProgressDraw[]>([])

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
    const [t, b, co, d] = await Promise.all([
      call(`/api/tasks?projectId=${projectId}`),
      call(`/api/budget?projectId=${projectId}`),
      call(`/api/change-orders?projectId=${projectId}`),
      call(`/api/progress-draws?projectId=${projectId}`),
    ])
    setTasks(t || [])
    setBudget(b || [])
    setChangeOrders(co || [])
    setDraws(d || [])
  }

  const metrics = useMemo(() => {
    const totalBudget = budget.reduce((acc, b) => acc + Number(b.budget_amount || 0), 0)
    const spent = budget.reduce((acc, b) => acc + Number(b.spent_amount || 0), 0)
    const variance = budget.reduce((acc, b) => acc + Number(b.variance || 0), 0)
    const coTotal = changeOrders.reduce((acc, co) => acc + Number(co.amount || 0), 0)
    const coApproved = changeOrders.filter((c) => c.status === "approved").length
    const coCount = changeOrders.length
    const progressAvg =
      tasks.length === 0 ? 0 : Math.round(tasks.reduce((acc, t) => acc + (t.progress_percentage || 0), 0) / tasks.length)
    const safetyScore = 100 // placeholder until safety scoring available; no safety on this page to avoid extra fetch

    return {
      cpi: spent === 0 ? "-" : (totalBudget / (spent + coTotal)).toFixed(2),
      spi: (progressAvg / 100).toFixed(2),
      safety: `${safetyScore}`,
      quality: `${Math.max(60, 100 - (coCount - coApproved) * 5)}`,
      progressAvg,
      variance,
      coRate: coCount === 0 ? "-" : `${Math.round((coApproved / coCount) * 100)}%`,
      drawTotal: draws.reduce((acc, d) => acc + Number(d.amount || 0), 0),
    }
  }, [budget, changeOrders, draws, tasks])

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen">Checking session...</div>
  }

  return (
    <PageWrapper title="KPIs & Metrics">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Cost Performance Index" value={metrics.cpi} icon={<TrendingUp size={18} />} />
          <MetricCard label="Schedule Performance Index" value={metrics.spi} icon={<Activity size={18} />} />
          <MetricCard label="Safety Score" value={metrics.safety} unit="%" icon={<Users size={18} />} />
          <MetricCard label="Change Approval" value={metrics.coRate} icon={<Target size={18} />} />
        </div>

        <SectionCard title="Progress Overview">
          {loading ? (
            <p className="text-sm text-[#6F6F6F]">Loading...</p>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-500 text-[#0C0C0C]">Average Task Progress</span>
                  <span className="text-xs text-[#6F6F6F]">{metrics.progressAvg}%</span>
                </div>
                <ProgressBar percent={metrics.progressAvg} showLabel={false} />
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-500 text-[#0C0C0C]">Budget Variance</span>
                  <span className="text-xs text-[#6F6F6F]">{metrics.variance.toFixed(2)}</span>
                </div>
                <ProgressBar percent={Math.min(100, Math.max(0, metrics.variance === 0 ? 100 : 50))} showLabel={false} />
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Draws & Costs">
          {loading ? (
            <p className="text-sm text-[#6F6F6F]">Loading...</p>
          ) : (
            <div className="text-sm text-[#0C0C0C] space-y-2">
              <p>
                <span className="font-semibold">Progress draws total:</span> {metrics.drawTotal}
              </p>
              <p>
                <span className="font-semibold">Change orders value:</span>{" "}
                {changeOrders.reduce((acc, c) => acc + Number(c.amount || 0), 0)}
              </p>
              <p>
                <span className="font-semibold">Budget sum:</span>{" "}
                {budget.reduce((acc, b) => acc + Number(b.budget_amount || 0), 0)}
              </p>
            </div>
          )}
        </SectionCard>
      </div>
    </PageWrapper>
  )
}
