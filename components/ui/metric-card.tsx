import type React from "react"
interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  trend?: number
  icon?: React.ReactNode
}

export default function MetricCard({ label, value, unit = "", trend, icon }: MetricCardProps) {
  return (
    <div className="w-full max-w-full overflow-x-hidden bg-white rounded-lg p-5 shadow-sm border border-[rgba(0,0,0,0.08)] hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-500 text-[#6F6F6F] uppercase tracking-wide">{label}</p>
        {icon && <div className="text-[#1C7C54] flex-shrink-0">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl lg:text-3xl font-semibold text-[#0C0C0C]">{value}</p>
        {unit && <span className="text-xs lg:text-sm text-[#6F6F6F]">{unit}</span>}
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-2">
          <div className={`text-xs font-500 ${trend >= 0 ? "text-[#1C7C54]" : "text-[#D9534F]"}`}>
            {trend >= 0 ? "up" : "down"} {Math.abs(trend)}%
          </div>
        </div>
      )}
    </div>
  )
}
