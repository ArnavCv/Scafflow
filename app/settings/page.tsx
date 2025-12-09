"use client"

import { useEffect, useState } from "react"
import PageWrapper from "@/components/layout/page-wrapper"
import SectionCard from "@/components/ui/section-card"
import { useProtectedPage, useAuth } from "@/hooks/use-auth"
import { useApi } from "@/hooks/use-api"

type Health = { status: string; timestamp: string }

export default function Settings() {
  const { user, logout } = useAuth()
  const { loading: authLoading } = useProtectedPage()
  const { call, loading } = useApi()
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const h = await call("/api/health", { skipAuth: true })
        setHealth(h)
      } catch (err: any) {
        setError(err?.message || "Health check failed")
      }
    }
    void load()
  }, [call])

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen">Checking session...</div>
  }

  return (
    <PageWrapper title="Settings">
      <div className="space-y-6">
        <SectionCard title="Profile">
          <div className="space-y-2 text-sm text-[#0C0C0C]">
            <p>
              <span className="font-semibold">Name:</span> {user?.name || "Unknown"}
            </p>
            <p>
              <span className="font-semibold">Email:</span> {user?.email}
            </p>
            <p>
              <span className="font-semibold">Role:</span> {user?.role}
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={logout}
                className="px-4 py-2 bg-[#1C7C54] text-white rounded-lg text-sm font-500 hover:bg-[#166544]"
              >
                Logout
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="System">
          <div className="text-sm text-[#0C0C0C] space-y-2">
            <p>
              <span className="font-semibold">API health:</span>{" "}
              {health ? `${health.status} @ ${health.timestamp}` : loading ? "Loading..." : "Unavailable"}
            </p>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <p className="text-xs text-[#6F6F6F]">
              Environment variables load from <code>.env.local</code>. Database URL and JWT secrets are required for API
              calls.
            </p>
          </div>
        </SectionCard>
      </div>
    </PageWrapper>
  )
}
