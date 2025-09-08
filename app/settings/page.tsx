"use client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CompanySettings } from "@/components/settings/company-settings"
import { EmailSettings } from "@/components/settings/email-settings"

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-2 p-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[oklch(35.04%_0.01007_216.95)]">Settings & Configuration</h1>
          <p className="text-[oklch(44.226%_0.00005_271.152)] font-semibold mt-1">Manage your system preferences and configuration</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CompanySettings />
          <EmailSettings />
        </div>
      </div>
    </DashboardLayout>
  )
}
