"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { BrandGrid } from "@/components/brands/brand-grid"
import { BrandFilters } from "@/components/brands/brand-filters"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { List, LayoutGrid } from "lucide-react"
export default function BrandsPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [reloadKey, setReloadKey] = useState(0)
  const [view, setView] = useState<"list" | "grid">("grid")
  const [brands, setBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/brands", {
          cache: "no-store"
        });
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (!res.ok) throw new Error("Failed to load brands");
        const json = await res.json();
        const list = (json?.data ?? []).map((b: any) => ({
          id: b.id ?? b._id,
          name: b.name,
          status: b.status ?? "",
          createdAt: b.createdAt ?? "",
        }));
        if (alive) setBrands(list);
      } catch (e: any) {
        if (alive) setError(e?.message ?? "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const filteredBrands = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return brands.filter((brand) => {
      const matchesStatus = statusFilter === "all" || brand.status === statusFilter;
      const matchesSearch = brand.name.toLowerCase().includes(q) || (brand.description ?? "").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [brands, statusFilter, searchQuery]);

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight  text-[oklch(35.04%_0.01007_216.95)]">Brands</h1>
            <p className="text-[oklch(44.226%_0.00005_271.152)] font-semibold">Manage your brand and status</p>
          </div>
          <a href="/brands/add">
            <Button className="bg-[oklch(32.988%_0.05618_196.615)] text-white hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4 " />
              Add Brand
            </Button>
          </a>
        </div>

        {/* Filters and List/Grid Toggle in one line */}
        <div className="flex items-center justify-between gap-4 py-2">
          <div className="flex-1 min-w-0">
            <BrandFilters
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("list")}
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" /> List
            </Button>
            <Button
              variant={view === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("grid")}
              className="flex items-center gap-2"
            >
              <LayoutGrid className="h-4 w-4" /> Grid
            </Button>
          </div>
        </div>

        {/* Render list or grid view */}
        {loading ? (
          <div className="text-center py-12"><div className="text-[oklch(0%_0_0)]">Loading brands…</div></div>
        ) : error ? (
          <div className="text-center py-12"><div className="text-red-500">{error}</div></div>
        ) : filteredBrands.length === 0 ? (
          <div className="text-center py-12"><div className="text-muted-foreground">No brands found.</div></div>
        ) : view === "grid" ? (
          <BrandGrid statusFilter={statusFilter} searchQuery={searchQuery} reloadKey={reloadKey} />
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-3 py-2 font-bold">Name</th>
                  <th className="px-3 py-2 font-bold">Status</th>
                  <th className="px-3 py-2 font-bold">Website</th>
                  <th className="px-3 py-2 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBrands.map((b) => (
                  <tr key={b.id} className="border-t">
                    <td className="px-3 py-2">{b.name}</td>
                    <td className="px-3 py-2">{b.status}</td>
                    <td className="px-3 py-2">{b.websiteUrl}</td>
                    <td className="px-3 py-2">
                      <a href={`/brands/${b.id}`} className="text-blue-600 hover:underline">View</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}