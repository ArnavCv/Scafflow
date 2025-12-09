import type React from "react"

interface PageWrapperProps {
  title: string
  children: React.ReactNode
}

export default function PageWrapper({ title, children }: PageWrapperProps) {
  return (
    <>
      <div className="w-full max-w-full overflow-x-hidden flex flex-col">
        <div className="flex flex-col w-full max-w-full px-8 py-6 overflow-x-hidden">
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-semibold text-[#0C0C0C]">{title}</h1>
          </div>
          {children}
        </div>
      </div>
    </>
  )
}
