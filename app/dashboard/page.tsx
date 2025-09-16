"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { StatsCards } from "@/components/stats-cards"
import { RecentActivity } from "@/components/recent-activity"

export default function Dashboard() {
    return (
        <DashboardLayout>
            <div className="p-8 space-y-8">
                <StatsCards />
                <RecentActivity />
            </div>
        </DashboardLayout>
    )
}