"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Settings, User } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export default function Topbar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    return null
  }

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-[rgba(0,0,0,0.08)] bg-white/70 backdrop-blur">
      <div className="flex items-center gap-2 text-sm text-[#6F6F6F]">
        <User size={16} />
        <span className="text-[#0C0C0C] font-semibold">{user?.name || "Signed in"}</span>
        <span className="text-[#6F6F6F]">{user?.email}</span>
      </div>
      <div className="flex items-center gap-2">
        {user?.role === "admin" && (
          <Link
            href="/admin"
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-[rgba(0,0,0,0.08)] hover:bg-[#F8F8F8]"
          >
            Admin
          </Link>
        )}
        <Link
          href="/settings"
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-[rgba(0,0,0,0.08)] hover:bg-[#F8F8F8]"
        >
          <Settings size={16} /> Settings
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-[#1C7C54] text-white hover:bg-[#166544]"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  )
}
