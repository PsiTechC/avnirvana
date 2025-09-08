"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { StatsCards } from "@/components/stats-cards"
import { RecentActivity } from "@/components/recent-activity"

export default function Dashboard() {
    // Client-side authentication check
    if (typeof window !== "undefined") {
        const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
        if (!isAuthenticated) {
            window.location.replace("/login");
            return null;
        }
    }
    return (
        <DashboardLayout>
            <div className="p-8 space-y-8">
                <StatsCards />
                <RecentActivity />
            </div>
        </DashboardLayout>
    )
}