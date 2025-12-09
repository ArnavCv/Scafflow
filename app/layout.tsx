import type React from "react"
import type { Metadata } from "next"
import { Montserrat } from "next/font/google"
import "./globals.css"
import Sidebar from "@/components/layout/sidebar"
import { AuthProvider } from "@/hooks/use-auth"
import Topbar from "@/components/layout/topbar"

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Scafflow - Construction Management",
  description: "Scafflow construction management dashboard",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body>
        <AuthProvider>
          <div className="flex h-screen bg-[#F8F8F8] w-full overflow-hidden">
            <Sidebar />
            <main className="flex-1 w-full max-w-full overflow-hidden flex flex-col">
              <Topbar />
              <div className="flex-1 overflow-y-auto overflow-x-hidden">{children}</div>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
