"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/types"

type AuthContextValue = {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (stored) {
      setToken(stored)
    } else {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
    }
    setToken(null)
    setUser(null)
    router.push("/login")
  }, [router])

  const fetchMe = useCallback(
    async (authToken: string | null) => {
      if (!authToken) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        if (res.status === 401) {
          logout()
          return
        }
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || "Failed to load user")
        }
        setUser(data)
      } catch (err: any) {
        setError(err?.message || "Failed to load user")
        logout()
      } finally {
        setLoading(false)
      }
    },
    [logout],
  )

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    setLoading(true)
    fetchMe(token)
  }, [fetchMe, token])

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null)
      setLoading(true)
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || "Login failed")
        }
        setUser(data.user)
        setToken(data.token)
        if (typeof window !== "undefined") {
          localStorage.setItem("token", data.token)
        }
        router.push("/dashboard")
      } finally {
        setLoading(false)
      }
    },
    [router],
  )

  const signup = useCallback(
    async (email: string, password: string, name: string) => {
      setError(null)
      setLoading(true)
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || "Signup failed")
        }
        setUser(data.user)
        setToken(data.token)
        if (typeof window !== "undefined") {
          localStorage.setItem("token", data.token)
        }
        router.push("/dashboard")
      } finally {
        setLoading(false)
      }
    },
    [router],
  )

  const refreshUser = useCallback(async () => {
    if (!token) return
    setLoading(true)
    await fetchMe(token)
  }, [fetchMe, token])

  const value = useMemo(
    () => ({ user, token, loading, error, login, signup, logout, refreshUser }),
    [error, loading, login, logout, refreshUser, signup, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export function useProtectedPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, router, user])

  return { user, loading }
}
