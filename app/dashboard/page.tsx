"use client"

import { useEffect, useMemo, useState } from "react"
import PageWrapper from "@/components/layout/page-wrapper"
import MetricCard from "@/components/ui/metric-card"
import SectionCard from "@/components/ui/section-card"
import ProgressBar from "@/components/ui/progress-bar"
import { TrendingUp, Users, Calendar, DollarSign } from "lucide-react"
import { useApi } from "@/hooks/use-api"
import { useProtectedPage } from "@/hooks/use-auth"
import type { Project, Task, ProgressDraw, ChangeOrder } from "@/lib/types"

export default function Dashboard() {
  const { loading: authLoading } = useProtectedPage()
  const { call } = useApi()
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [draws, setDraws] = useState<ProgressDraw[]>([])
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([])
  const [loadingData, setLoadingData] = useState(false)

  const activeProjectId = projects[0]?.id

  useEffect(() => {
    const load = async () => {
      setLoadingData(true)
      try {
        const projectList = await call("/api/projects")
        setProjects(projectList || [])
        const projectId = projectList?.[0]?.id
        if (projectId) {
          const [taskRes, drawRes, coRes] = await Promise.all([
            call(`/api/tasks?projectId=${projectId}`),
            call(`/api/progress-draws?projectId=${projectId}`),
            call(`/api/change-orders?projectId=${projectId}`),
          ])
          setTasks(taskRes || [])
          setDraws(drawRes || [])
          setChangeOrders(coRes || [])
        } else {
          setTasks([])
          setDraws([])
          setChangeOrders([])
        }
      } catch {
        setProjects([])
        setTasks([])
        setDraws([])
        setChangeOrders([])
      } finally {
        setLoadingData(false)
      }
    }
    if (!authLoading) {
      void load()
    }
  }, [authLoading, call])

  const progressAvg = useMemo(() => {
    if (tasks.length === 0) return 0
    const total = tasks.reduce((acc, t) => acc + (t.progress_percentage || 0), 0)
    return Math.round(total / tasks.length)
  }, [tasks])

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen">Checking session...</div>
  }

  return (
    <PageWrapper title="Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Projects" value={projects.length.toString()} icon={<Calendar size={18} />} />
          <MetricCard label="Tasks" value={tasks.length.toString()} icon={<TrendingUp size={18} />} />
          <MetricCard label="Progress Draws" value={draws.length.toString()} icon={<Users size={18} />} />
          <MetricCard label="Change Orders" value={changeOrders.length.toString()} icon={<DollarSign size={18} />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Project Health">
            {loadingData ? (
              <p className="text-sm text-[#6F6F6F]">Loading data...</p>
            ) : projects.length === 0 ? (
              <p className="text-sm text-[#6F6F6F]">Create a project to see metrics.</p>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 4).map((project) => (
                  <div key={project.id}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-500 text-[#0C0C0C]">{project.name}</span>
                      <span className="text-xs text-[#6F6F6F]">{project.progress_percentage ?? 0}%</span>
                    </div>
                    <ProgressBar percent={project.progress_percentage ?? 0} showLabel={false} />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Task Progress">
            {loadingData ? (
              <p className="text-sm text-[#6F6F6F]">Loading tasks...</p>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#0C0C0C]">Average Progress</span>
                  <span className="text-sm font-semibold text-[#1C7C54]">{progressAvg}%</span>
                </div>
                <ProgressBar percent={progressAvg} showLabel />
                <p className="text-xs text-[#6F6F6F]">
                  Showing tasks for project {activeProjectId ?? "-"}. Create tasks to see progress here.
                </p>
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard title="Latest Progress Draws">
          {loadingData ? (
            <p className="text-sm text-[#6F6F6F]">Loading progress draws...</p>
          ) : (
            <div className="space-y-2">
              {draws.slice(0, 5).map((draw) => (
                <div key={draw.id} className="border border-[rgba(0,0,0,0.08)] rounded-lg p-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-[#0C0C0C]">{draw.draw_number || `Draw ${draw.id}`}</span>
                    <span className="text-xs text-[#6F6F6F]">{draw.status}</span>
                  </div>
                  <p className="text-xs text-[#6F6F6F]">Amount: {draw.amount}</p>
                </div>
              ))}
              {draws.length === 0 && <p className="text-sm text-[#6F6F6F]">No progress draws yet.</p>}
            </div>
          )}
        </SectionCard>
      </div>
    </PageWrapper>
  )
}
