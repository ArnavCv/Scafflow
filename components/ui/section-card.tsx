import type React from "react"

interface SectionCardProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export default function SectionCard({ title, children, className = "" }: SectionCardProps) {
  return (
    <div
      className={`w-full max-w-full overflow-x-hidden bg-white rounded-lg p-6 shadow-sm border border-[rgba(0,0,0,0.08)] ${className}`}
    >
      {title && <h3 className="text-base font-semibold text-[#0C0C0C] mb-4">{title}</h3>}
      {children}
    </div>
  )
}
