"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard,
  AlertTriangle,
  Zap,
  Wallet,
  Calendar,
  TrendingUp,
  BarChart3,
  Users,
  Settings,
  Menu,
  X,
} from "lucide-react"

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: Calendar },
  { name: "Safety & Mobilization", href: "/safety-mobilization", icon: AlertTriangle },
  { name: "Execution Workflow", href: "/execution-workflow", icon: Zap },
  { name: "Budget & Costs", href: "/budget-costs", icon: Wallet },
  { name: "Schedule & Orders", href: "/schedule-orders", icon: Calendar },
  { name: "Progress Draws", href: "/progress-draws", icon: TrendingUp },
  { name: "Change Orders", href: "/change-orders", icon: BarChart3 },
  { name: "KPIs & Metrics", href: "/kpis-metrics", icon: BarChart3 },
  { name: "Collaboration", href: "/collaboration", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const hiddenRoutes = ["/login", "/signup"]

  if (hiddenRoutes.some((route) => pathname?.startsWith(route))) {
    return null
  }

  return (
    <>
      <aside
        className={`h-screen bg-white border-r border-[rgba(0,0,0,0.08)] shadow-sm flex flex-col transition-all duration-300 ease-out flex-shrink-0 ${
          isCollapsed ? "w-20" : "w-64"
        } hidden lg:flex`}
      >
        {/* Header */}
        <div className="p-6 border-b border-[rgba(0,0,0,0.08)] flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-semibold text-[#0C0C0C]">Scafflow</h1>
              <p className="text-xs text-[#6F6F6F] mt-0.5">Construction</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-[#F8F8F8] rounded-lg transition-colors text-[#6F6F6F]"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <div key={item.href} className="group relative">
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      isActive ? "bg-[#E6F3EC] text-[#1C7C54] font-500" : "text-[#6F6F6F] hover:bg-[#F8F8F8]"
                    }`}
                    title={isCollapsed ? item.name : ""}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-[#0C0C0C] text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      {item.name}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[rgba(0,0,0,0.08)]">
          <div className="bg-[#E6F3EC] rounded-lg p-3">
            {!isCollapsed && (
              <>
                <p className="text-xs font-500 text-[#1C7C54]">v1.0.0</p>
                <p className="text-xs text-[#6F6F6F] mt-1">Ready</p>
              </>
            )}
            {isCollapsed && <p className="text-xs font-500 text-[#1C7C54] text-center">v1</p>}
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <button className="p-2 bg-white rounded-lg shadow-sm border border-[rgba(0,0,0,0.08)]">
          <Menu size={20} className="text-[#0C0C0C]" />
        </button>
      </div>
    </>
  )
}
