"use client"

import { useEffect, useMemo, useState } from "react"
import PageWrapper from "@/components/layout/page-wrapper"
import SectionCard from "@/components/ui/section-card"
import StatusPill from "@/components/ui/status-pill"
import { useProtectedPage } from "@/hooks/use-auth"
import { useApi } from "@/hooks/use-api"
import { useProjects } from "@/hooks/use-projects"
import type { Project, Task, SafetyIncident, BudgetItem, ChangeOrder, ProgressDraw } from "@/lib/types"

type ApiError = string | null

export default function ProjectsPage() {
  const { user, loading: authLoading } = useProtectedPage()
  const { projects, createProject, mutate } = useProjects()
  const { call, loading: apiLoading, error: apiError, setError } = useApi()
  const isAdmin = user?.role === "admin"

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [safety, setSafety] = useState<SafetyIncident[]>([])
  const [budget, setBudget] = useState<BudgetItem[]>([])
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([])
  const [progressDraws, setProgressDraws] = useState<ProgressDraw[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [formError, setFormError] = useState<ApiError>(null)
  const [projectUpdateForm, setProjectUpdateForm] = useState({
    status: "",
    budget_spent: "",
    progress_percentage: "",
    description: "",
  })

  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    location: "",
    budget_total: "",
    start_date: "",
    end_date: "",
  })

  const [taskForm, setTaskForm] = useState({ title: "", status: "pending", priority: "medium" })
  const [budgetForm, setBudgetForm] = useState({ category: "", description: "", budget_amount: "" })
  const [safetyForm, setSafetyForm] = useState({ severity: "medium", description: "", incident_type: "general" })
  const [changeOrderForm, setChangeOrderForm] = useState({ title: "", description: "", amount: "" })
  const [progressDrawForm, setProgressDrawForm] = useState({ draw_number: "", amount: "" })
  const [taskEdits, setTaskEdits] = useState<Record<number, { status: string; progress: string }>>({})

  const activeProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId],
  )

  useEffect(() => {
    if (!authLoading && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id)
    }
  }, [authLoading, projects, selectedProjectId])

  useEffect(() => {
    if (selectedProjectId) {
      void loadProjectData(selectedProjectId)
    }
  }, [selectedProjectId])

  useEffect(() => {
    if (activeProject) {
      setProjectUpdateForm({
        status: activeProject.status || "",
        budget_spent: activeProject.budget_spent?.toString() || "",
        progress_percentage: activeProject.progress_percentage?.toString() || "",
        description: activeProject.description || "",
      })
    }
  }, [activeProject])

  const loadProjectData = async (projectId: number) => {
    setLoadingData(true)
    setError(null)
    try {
      const [taskRes, budgetRes, safetyRes, coRes, drawRes] = await Promise.all([
        call(`/api/tasks?projectId=${projectId}`),
        call(`/api/budget?projectId=${projectId}`),
        call(`/api/safety?projectId=${projectId}`),
        call(`/api/change-orders?projectId=${projectId}`),
        call(`/api/progress-draws?projectId=${projectId}`),
      ])
      setTasks(taskRes || [])
      setBudget(budgetRes || [])
      setSafety(safetyRes || [])
      setChangeOrders(coRes || [])
      setProgressDraws(drawRes || [])
    } catch (err: any) {
      setFormError(err?.message || "Failed to load project data")
    } finally {
      setLoadingData(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    try {
      const created = await createProject({
        ...projectForm,
        budget_total: projectForm.budget_total ? Number(projectForm.budget_total) : null,
        start_date: projectForm.start_date || null,
        end_date: projectForm.end_date || null,
      } as Partial<Project>)
      setProjectForm({ name: "", description: "", location: "", budget_total: "", start_date: "", end_date: "" })
      await mutate()
      setSelectedProjectId(created.id)
    } catch (err: any) {
      setFormError(err?.message || "Failed to create project")
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId) return
    setFormError(null)
    try {
      await call("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          project_id: selectedProjectId,
          title: taskForm.title,
          status: taskForm.status,
          priority: taskForm.priority,
        }),
      })
      setTaskForm({ title: "", status: "pending", priority: "medium" })
      await loadProjectData(selectedProjectId)
    } catch (err: any) {
      setFormError(err?.message || "Failed to create task")
    }
  }

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId) return
    setFormError(null)
    try {
      await call("/api/budget", {
        method: "POST",
        body: JSON.stringify({
          project_id: selectedProjectId,
          category: budgetForm.category,
          description: budgetForm.description,
          budget_amount: Number(budgetForm.budget_amount || 0),
        }),
      })
      setBudgetForm({ category: "", description: "", budget_amount: "" })
      await loadProjectData(selectedProjectId)
    } catch (err: any) {
      setFormError(err?.message || "Failed to create budget item")
    }
  }

  const handleCreateSafety = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId) return
    setFormError(null)
    try {
      await call("/api/safety", {
        method: "POST",
        body: JSON.stringify({
          project_id: selectedProjectId,
          severity: safetyForm.severity,
          description: safetyForm.description,
          incident_type: safetyForm.incident_type,
        }),
      })
      setSafetyForm({ severity: "medium", description: "", incident_type: "general" })
      await loadProjectData(selectedProjectId)
    } catch (err: any) {
      setFormError(err?.message || "Failed to create safety incident")
    }
  }

  const handleCreateChangeOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId) return
    setFormError(null)
    try {
      await call("/api/change-orders", {
        method: "POST",
        body: JSON.stringify({
          project_id: selectedProjectId,
          title: changeOrderForm.title,
          description: changeOrderForm.description,
          amount: Number(changeOrderForm.amount || 0),
        }),
      })
      setChangeOrderForm({ title: "", description: "", amount: "" })
      await loadProjectData(selectedProjectId)
    } catch (err: any) {
      setFormError(err?.message || "Failed to create change order")
    }
  }

  const handleCreateProgressDraw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId) return
    setFormError(null)
    try {
      await call("/api/progress-draws", {
        method: "POST",
        body: JSON.stringify({
          project_id: selectedProjectId,
          draw_number: progressDrawForm.draw_number,
          amount: Number(progressDrawForm.amount || 0),
        }),
      })
      setProgressDrawForm({ draw_number: "", amount: "" })
      await loadProjectData(selectedProjectId)
    } catch (err: any) {
      setFormError(err?.message || "Failed to create progress draw")
    }
  }

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId || isAdmin) return
    setFormError(null)
    try {
      await call(`/api/projects/${selectedProjectId}`, {
        method: "PUT",
        body: JSON.stringify({
          status: projectUpdateForm.status || null,
          budget_spent: projectUpdateForm.budget_spent ? Number(projectUpdateForm.budget_spent) : null,
          progress_percentage: projectUpdateForm.progress_percentage
            ? Number(projectUpdateForm.progress_percentage)
            : null,
          description: projectUpdateForm.description || null,
        }),
      })
      await mutate()
      await loadProjectData(selectedProjectId)
    } catch (err: any) {
      setFormError(err?.message || "Failed to update project")
    }
  }

  const handleUpdateTask = async (taskId: number) => {
    const edits = taskEdits[taskId]
    if (!edits) return
    if (!selectedProjectId) return
    setFormError(null)
    try {
      await call(`/api/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({
          status: edits.status,
          progress_percentage: Number(edits.progress || 0),
        }),
      })
      await loadProjectData(selectedProjectId)
    } catch (err: any) {
      setFormError(err?.message || "Failed to update task")
    }
  }

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen">Checking session...</div>
  }

  return (
    <PageWrapper title="Projects">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Create Project">
          {isAdmin ? (
            <p className="text-sm text-[#6F6F6F]">Admins are read-only here. Use a user account to create projects.</p>
          ) : (
            <form className="space-y-3" onSubmit={handleCreateProject}>
              <input
                className="w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                placeholder="Project name"
                value={projectForm.name}
                onChange={(e) => setProjectForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <input
                className="w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                placeholder="Location"
                value={projectForm.location}
                onChange={(e) => setProjectForm((f) => ({ ...f, location: e.target.value }))}
              />
              <textarea
                className="w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                placeholder="Description"
                value={projectForm.description}
                onChange={(e) => setProjectForm((f) => ({ ...f, description: e.target.value }))}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  className="w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                  placeholder="Budget total"
                  type="number"
                  value={projectForm.budget_total}
                  onChange={(e) => setProjectForm((f) => ({ ...f, budget_total: e.target.value }))}
                />
                <input
                  className="w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                  placeholder="Start date"
                  type="date"
                  value={projectForm.start_date}
                  onChange={(e) => setProjectForm((f) => ({ ...f, start_date: e.target.value }))}
                />
                <input
                  className="w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                  placeholder="End date"
                  type="date"
                  value={projectForm.end_date}
                  onChange={(e) => setProjectForm((f) => ({ ...f, end_date: e.target.value }))}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#1C7C54] text-white rounded-lg py-2 text-sm font-semibold hover:bg-[#166544] transition-colors"
              >
                Create Project
              </button>
            </form>
          )}
        </SectionCard>

        <SectionCard title="Projects List">
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className={`w-full text-left border rounded-lg p-3 transition-colors ${
                  project.id === selectedProjectId
                    ? "border-[#1C7C54] bg-[#E6F3EC]"
                    : "border-[rgba(0,0,0,0.08)] hover:bg-[#F8F8F8]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#0C0C0C]">{project.name}</p>
                    <p className="text-xs text-[#6F6F6F]">{project.location || "No location"}</p>
                    <p className="text-xs text-[#6F6F6F]">
                      Owner: {project.owner_name || (isAdmin ? "Unknown" : "You")}
                    </p>
                  </div>
                  <StatusPill status="requested" label={project.status || "active"} />
                </div>
                <p className="text-xs text-[#6F6F6F] mt-1">
                  Budget: {project.budget_total ?? "-"} | Progress: {project.progress_percentage ?? 0}%
                </p>
              </button>
            ))}
            {projects.length === 0 && <p className="text-sm text-[#6F6F6F]">No projects yet.</p>}
          </div>
        </SectionCard>

        <SectionCard title="Selected Project">
          {!activeProject ? (
            <p className="text-sm text-[#6F6F6F]">Select or create a project to see details.</p>
          ) : (
            <div className="space-y-2 text-sm text-[#0C0C0C]">
              <p className="font-semibold">{activeProject.name}</p>
              <p className="text-[#6F6F6F]">{activeProject.description || "No description"}</p>
              <p>Status: {activeProject.status}</p>
              <p>Budget: {activeProject.budget_total ?? "-"}</p>
              <p>Progress: {activeProject.progress_percentage ?? 0}%</p>
              <p>Owner: {activeProject.owner_name || (isAdmin ? "Unknown" : "You")}</p>
              {!isAdmin && (
                <form className="space-y-2 pt-2 border-t border-[rgba(0,0,0,0.06)]" onSubmit={handleUpdateProject}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      className="w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                      placeholder="Status"
                      value={projectUpdateForm.status}
                      onChange={(e) => setProjectUpdateForm((f) => ({ ...f, status: e.target.value }))}
                    />
                    <input
                      className="w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                      placeholder="Budget spent"
                      type="number"
                      value={projectUpdateForm.budget_spent}
                      onChange={(e) => setProjectUpdateForm((f) => ({ ...f, budget_spent: e.target.value }))}
                    />
                    <input
                      className="w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                      placeholder="Progress %"
                      type="number"
                      min={0}
                      max={100}
                      value={projectUpdateForm.progress_percentage}
                      onChange={(e) =>
                        setProjectUpdateForm((f) => ({ ...f, progress_percentage: e.target.value }))
                      }
                    />
                  </div>
                  <textarea
                    className="w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                    placeholder="Description"
                    value={projectUpdateForm.description}
                    onChange={(e) => setProjectUpdateForm((f) => ({ ...f, description: e.target.value }))}
                  />
                  <button
                    type="submit"
                    className="bg-[#1C7C54] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#166544]"
                    disabled={apiLoading || loadingData}
                  >
                    Update Project
                  </button>
                </form>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      {formError && <p className="text-sm text-red-600 mt-3">{formError}</p>}
      {apiError && <p className="text-sm text-red-600 mt-1">{apiError}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <SectionCard title="Tasks">
          {!isAdmin && (
            <form className="flex flex-col sm:flex-row gap-2 mb-3" onSubmit={handleCreateTask}>
              <input
                className="flex-1 border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                placeholder="Task title"
                value={taskForm.title}
                onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
              <select
                className="border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                value={taskForm.status}
                onChange={(e) => setTaskForm((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <button
                type="submit"
                className="bg-[#1C7C54] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#166544]"
                disabled={!selectedProjectId || apiLoading || loadingData}
              >
                Add
              </button>
            </form>
          )}
          {loadingData ? (
            <p className="text-sm text-[#6F6F6F]">Loading tasks...</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="border border-[rgba(0,0,0,0.08)] rounded-lg p-3 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-500 text-[#0C0C0C]">{task.title}</p>
                      <p className="text-xs text-[#6F6F6F]">Progress: {task.progress_percentage ?? 0}%</p>
                    </div>
                    <StatusPill status={task.status === "completed" ? "paid" : "requested"} label={task.status} />
                  </div>
                  {!isAdmin && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        className="border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                        value={taskEdits[task.id]?.status ?? task.status}
                        onChange={(e) =>
                          setTaskEdits((prev) => ({ ...prev, [task.id]: { ...(prev[task.id] || {}), status: e.target.value } }))
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      <input
                        className="border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                        type="number"
                        min={0}
                        max={100}
                        value={taskEdits[task.id]?.progress ?? task.progress_percentage ?? 0}
                        onChange={(e) =>
                          setTaskEdits((prev) => ({
                            ...prev,
                            [task.id]: { ...(prev[task.id] || {}), progress: e.target.value },
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="bg-[#1C7C54] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#166544]"
                        onClick={() => handleUpdateTask(task.id)}
                        disabled={apiLoading || loadingData}
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {tasks.length === 0 && <p className="text-sm text-[#6F6F6F]">No tasks found.</p>}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Budget Items">
          {!isAdmin && (
            <form className="flex flex-col sm:flex-row gap-2 mb-3" onSubmit={handleCreateBudget}>
              <input
                className="flex-1 border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                placeholder="Category"
                value={budgetForm.category}
                onChange={(e) => setBudgetForm((f) => ({ ...f, category: e.target.value }))}
                required
              />
              <input
                className="w-32 border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                placeholder="Budget"
                type="number"
                value={budgetForm.budget_amount}
                onChange={(e) => setBudgetForm((f) => ({ ...f, budget_amount: e.target.value }))}
              />
              <button
                type="submit"
                className="bg-[#1C7C54] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#166544]"
                disabled={!selectedProjectId || apiLoading || loadingData}
              >
                Add
              </button>
            </form>
          )}
          {loadingData ? (
            <p className="text-sm text-[#6F6F6F]">Loading budget...</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {budget.map((item) => (
                <div
                  key={item.id}
                  className="border border-[rgba(0,0,0,0.08)] rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-500 text-[#0C0C0C]">{item.category}</p>
                    <p className="text-xs text-[#6F6F6F]">Budget: {item.budget_amount}</p>
                  </div>
                  <p className="text-xs text-[#6F6F6F]">Spent: {item.spent_amount ?? 0}</p>
                </div>
              ))}
              {budget.length === 0 && <p className="text-sm text-[#6F6F6F]">No budget items found.</p>}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <SectionCard title="Safety Incidents">
          {!isAdmin && (
            <form className="flex flex-col sm:flex-row gap-2 mb-3" onSubmit={handleCreateSafety}>
              <input
                className="flex-1 border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                placeholder="Description"
                value={safetyForm.description}
                onChange={(e) => setSafetyForm((f) => ({ ...f, description: e.target.value }))}
                required
              />
              <select
                className="border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                value={safetyForm.severity}
                onChange={(e) => setSafetyForm((f) => ({ ...f, severity: e.target.value }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button
                type="submit"
                className="bg-[#1C7C54] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#166544]"
                disabled={!selectedProjectId || apiLoading || loadingData}
              >
                Add
              </button>
            </form>
          )}
          {loadingData ? (
            <p className="text-sm text-[#6F6F6F]">Loading incidents...</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {safety.map((incident) => (
                <div key={incident.id} className="border border-[rgba(0,0,0,0.08)] rounded-lg p-3">
                  <p className="text-sm font-500 text-[#0C0C0C]">{incident.description}</p>
                  <p className="text-xs text-[#6F6F6F]">Severity: {incident.severity}</p>
                </div>
              ))}
              {safety.length === 0 && <p className="text-sm text-[#6F6F6F]">No incidents recorded.</p>}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Change Orders">
          {!isAdmin && (
            <form className="flex flex-col sm:flex-row gap-2 mb-3" onSubmit={handleCreateChangeOrder}>
              <input
                className="flex-1 border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                placeholder="Title"
                value={changeOrderForm.title}
                onChange={(e) => setChangeOrderForm((f) => ({ ...f, title: e.target.value }))}
              />
              <input
                className="w-32 border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                placeholder="Amount"
                type="number"
                value={changeOrderForm.amount}
                onChange={(e) => setChangeOrderForm((f) => ({ ...f, amount: e.target.value }))}
                required
              />
              <button
                type="submit"
                className="bg-[#1C7C54] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#166544]"
                disabled={!selectedProjectId || apiLoading || loadingData}
              >
                Add
              </button>
            </form>
          )}
          {!isAdmin && (
            <textarea
              className="w-full border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm mb-3"
              placeholder="Description"
              value={changeOrderForm.description}
              onChange={(e) => setChangeOrderForm((f) => ({ ...f, description: e.target.value }))}
            />
          )}
          {loadingData ? (
            <p className="text-sm text-[#6F6F6F]">Loading change orders...</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {changeOrders.map((order) => (
                <div key={order.id} className="border border-[rgba(0,0,0,0.08)] rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-500 text-[#0C0C0C]">{order.title || "Change Order"}</p>
                    <StatusPill status={order.status === "approved" ? "paid" : "requested"} label={order.status} />
                  </div>
                  <p className="text-xs text-[#6F6F6F]">Amount: {order.amount}</p>
                  <p className="text-xs text-[#6F6F6F] mt-1">{order.description}</p>
                </div>
              ))}
              {changeOrders.length === 0 && <p className="text-sm text-[#6F6F6F]">No change orders.</p>}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <SectionCard title="Progress Draws">
          {!isAdmin && (
            <form className="flex flex-col sm:flex-row gap-2 mb-3" onSubmit={handleCreateProgressDraw}>
              <input
                className="flex-1 border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                placeholder="Draw number"
                value={progressDrawForm.draw_number}
                onChange={(e) => setProgressDrawForm((f) => ({ ...f, draw_number: e.target.value }))}
              />
              <input
                className="w-32 border border-[rgba(0,0,0,0.1)] rounded-lg px-3 py-2 text-sm"
                placeholder="Amount"
                type="number"
                value={progressDrawForm.amount}
                onChange={(e) => setProgressDrawForm((f) => ({ ...f, amount: e.target.value }))}
                required
              />
              <button
                type="submit"
                className="bg-[#1C7C54] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-[#166544]"
                disabled={!selectedProjectId || apiLoading || loadingData}
              >
                Add
              </button>
            </form>
          )}
          {loadingData ? (
            <p className="text-sm text-[#6F6F6F]">Loading progress draws...</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {progressDraws.map((draw) => (
                <div key={draw.id} className="border border-[rgba(0,0,0,0.08)] rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-500 text-[#0C0C0C]">{draw.draw_number || "Draw"}</p>
                    <StatusPill status={draw.status === "paid" ? "paid" : "requested"} label={draw.status} />
                  </div>
                  <p className="text-xs text-[#6F6F6F]">Amount: {draw.amount}</p>
                </div>
              ))}
              {progressDraws.length === 0 && <p className="text-sm text-[#6F6F6F]">No progress draws.</p>}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Meta">
          <div className="space-y-2 text-sm text-[#0C0C0C]">
            <p>Signed in as: {user?.email}</p>
            <p>Active project ID: {selectedProjectId ?? "None"}</p>
            <p>API loading: {apiLoading ? "Yes" : "No"}</p>
            {isAdmin && <p className="text-xs text-[#6F6F6F]">Admin view is read-only for project data.</p>}
          </div>
        </SectionCard>
      </div>
    </PageWrapper>
  )
}
