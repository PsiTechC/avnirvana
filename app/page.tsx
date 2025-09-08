
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StatsCards } from "@/components/stats-cards"
import { RecentActivity } from "@/components/recent-activity"
import { LoginPage } from "@/components/login-page"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Read credentials from env (injected at build time)
  const ADMIN_USER = process.env.NEXT_PUBLIC_ADMIN_USER ;
  const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASS;

  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated")
    if (authStatus === "true") setIsAuthenticated(true)
    setIsLoading(false)
  }, [])

  const handleLogin = (username: string, password: string) => {
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      setIsAuthenticated(true)
      localStorage.setItem("isAuthenticated", "true")
    } else {
      alert(`Invalid credentials.Please use correct credentials.`)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("isAuthenticated")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <LoginPage onLogin={handleLogin} />

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[oklch(35.04%_0.01007_216.95)]">Dashboard Overview</h1>
        </div>

        {/* Live stats (no mock data) */}
        <StatsCards />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Live recent activity (no mock data) */}
          <RecentActivity />

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-[oklch(35.04%_0.01007_216.95)] mb-1">Quick Actions</h3>
            <p className="text-sm font-semibold text-[oklch(35.04%_0.01007_216.95)] mb-3">Common tasks and  action </p>
            <div className="space-y-2">
              <Button
                variant="default"
                className="w-full bg-[oklch(32.988%_0.05618_196.615)] text-white justify-start"
                onClick={() => router.push("/products/add")}
                title="Add a new product"
              >
                Add New Product
              </Button>

              <Button
                variant="default"
                className="w-full bg-[oklch(32.988%_0.05618_196.615)] text-white justify-start"
                onClick={() => router.push("/quotations/add")}
                title="Create a new quotation"
              >
                Create Quotation
              </Button>

              <Button
                variant="default"
                className="w-full bg-[oklch(32.988%_0.05618_196.615)] text-white justify-start"
                onClick={() => router.push("/dealers")}
                title="Manage dealers"
              >
                Manage Dealers
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
