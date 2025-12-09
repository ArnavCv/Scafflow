interface StatusPillProps {
  status: "completed" | "in-progress" | "pending" | "approved" | "requested" | "under-review" | "paid" | "neutral"
  label: string
}

const statusColors: Record<string, { bg: string; text: string }> = {
  completed: { bg: "#E6F3EC", text: "#1C7C54" },
  "in-progress": { bg: "#FEF3E2", text: "#F0AD4E" },
  pending: { bg: "#FEF3E2", text: "#F0AD4E" },
  approved: { bg: "#E6F3EC", text: "#1C7C54" },
  requested: { bg: "#E8F4FD", text: "#0275D8" },
  "under-review": { bg: "#FEF3E2", text: "#F0AD4E" },
  paid: { bg: "#E6F3EC", text: "#1C7C54" },
  neutral: { bg: "#F2F2F2", text: "#6F6F6F" },
}

export default function StatusPill({ status, label }: StatusPillProps) {
  const colors = statusColors[status] || statusColors.neutral
  return (
    <span
      className="px-3 py-1.5 rounded-full text-xs font-500 inline-block"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {label}
    </span>
  )
}
