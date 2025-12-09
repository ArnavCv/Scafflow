"use client"

import { useState } from "react"
import { Check } from "lucide-react"

interface ChecklistItemProps {
  label: string
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
}

export default function ChecklistItem({ label, defaultChecked = false, onChange }: ChecklistItemProps) {
  const [checked, setChecked] = useState(defaultChecked)

  const handleChange = () => {
    const newState = !checked
    setChecked(newState)
    onChange?.(newState)
  }

  return (
    <label className="flex items-center gap-3 cursor-pointer py-2.5 px-3 hover:bg-[#F8F8F8] rounded-lg transition-colors">
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          checked ? "bg-[#1C7C54] border-[#1C7C54]" : "border-[#1C7C54] bg-white"
        }`}
      >
        {checked && <Check size={14} className="text-white" />}
      </div>
      <span className={`text-sm ${checked ? "text-[#6F6F6F] line-through" : "text-[#0C0C0C]"}`}>{label}</span>
    </label>
  )
}
