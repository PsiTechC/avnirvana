"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DealerGrid } from "@/components/dealers/dealer-grid"
import { DealerFilters } from "@/components/dealers/dealer-filters"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function DealersPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [territoryFilter, setTerritoryFilter] = useState("all")
  const [dealers, setDealers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/dealers", {
          cache: "no-store"
        });
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (!res.ok) throw new Error("Failed to load dealers");
        const json = await res.json();
        const list = (json?.data ?? []).map((d: any) => ({
          id: d.id ?? d._id,
          name: d.name,
          status: d.status ?? "",
          createdAt: d.createdAt ?? "",
        }));
        if (alive) setDealers(list);
      } catch (e: any) {
        if (alive) setError(e?.message ?? "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[oklch(35.04%_0.01007_216.95)]">Dealer Management</h1>
            <p className="text-[oklch(44.226%_0.00005_271.152)]  font-semibold mt-2">Manage your dealer network and partnerships</p>
          </div>
          <Button onClick={() => window.location.href = '/dealers/add'} className="bg-[oklch(32.988%_0.05618_196.615)] text-white hover:bg-[oklch(32.988%_0.05618_196.615)]/90">
            <Plus className="mr-2 h-4 w-4" />
            Add Dealer
          </Button>
        </div>

        <DealerFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          territoryFilter={territoryFilter}
          setTerritoryFilter={setTerritoryFilter}
        />
        <DealerGrid
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          territoryFilter={territoryFilter}
        />
      </div>
    </DashboardLayout>
  )
}
