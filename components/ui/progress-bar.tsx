interface ProgressBarProps {
  percent: number
  showLabel?: boolean
}

export default function ProgressBar({ percent, showLabel = true }: ProgressBarProps) {
  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#1C7C54] transition-all duration-300" style={{ width: `${percent}%` }} />
      </div>
      {showLabel && <p className="text-xs text-[#6F6F6F] mt-1">{percent}%</p>}
    </div>
  )
}
