"use client"

import { useCallback, useState } from "react"
import { useAuth } from "./use-auth"

type ApiOptions = RequestInit & { skipAuth?: boolean }

export function useApi() {
  const { token, logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const call = useCallback(
    async (endpoint: string, options: ApiOptions = {}) => {
      setLoading(true)
      setError(null)
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(options.headers as Record<string, string>),
        }

        if (!options.skipAuth && token) {
          headers.Authorization = `Bearer ${token}`
        }

        const response = await fetch(endpoint, { ...options, headers })

        // Try to parse body once
        const parsed = await response
          .json()
          .catch(() => ({} as { error?: string | undefined; [key: string]: any }))

        if (response.status === 401) {
          logout()
          throw new Error("Unauthorized")
        }

        if (!response.ok) {
          throw new Error(parsed.error || "API error")
        }

        return parsed
      } catch (err: any) {
        const message = err?.message || "Unknown error"
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [logout, token],
  )

  return { call, loading, error, setError }
}
