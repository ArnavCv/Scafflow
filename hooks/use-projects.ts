import useSWR from "swr"
import { useApi } from "./use-api"
import type { Project } from "@/lib/types"

export function useProjects() {
  const { call } = useApi()

  const { data, error, isLoading, mutate } = useSWR<Project[]>(
    "/api/projects",
    (url) => call(url).catch(() => []),
    {
      shouldRetryOnError: false,
    },
  )

  const createProject = async (projectData: Partial<Project>) => {
    const result = await call("/api/projects", {
      method: "POST",
      body: JSON.stringify(projectData),
    })
    mutate()
    return result as Project
  }

  return {
    projects: data || [],
    loading: isLoading,
    error,
    createProject,
    mutate,
  }
}
