import type React from "react"
interface Column {
  key: string
  label: string
  render?: (value: any) => React.ReactNode
}

interface TableSimpleProps {
  columns: Column[]
  data: any[]
}

export default function TableSimple({ columns, data }: TableSimpleProps) {
  return (
    <div className="w-full max-w-full overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[rgba(0,0,0,0.08)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-4 text-left text-xs font-semibold text-[#6F6F6F] uppercase tracking-wide whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b border-[rgba(0,0,0,0.08)] hover:bg-gray-50 transition-colors">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-4 py-4 text-sm text-[#0C0C0C] whitespace-nowrap overflow-hidden text-ellipsis max-w-xs"
                >
                  {col.render ? col.render(row[col.key]) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
