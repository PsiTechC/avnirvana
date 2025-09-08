
"use client"

import type React from "react"
import { useState } from "react"
import { Sidebar } from "@/components/sidebar"


interface DashboardLayoutProps {
  children: React.ReactNode
  onLogout?: () => void
}

export function DashboardLayout({ children, onLogout }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    } else {
      window.location.href = "/login"
    }
  }

  return (
    <div className="min-h-screen bg-background">
     
      {/* Main layout container */}
      <div className="flex pt-1">
        {/* Sidebar - fixed width on desktop, overlay on mobile */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content area */}
  <main className="flex-1 lg:ml-64 min-h-[calc(100vh-4rem)] no-scrollbar">{children}</main>
      </div>
    </div>
  )
}
