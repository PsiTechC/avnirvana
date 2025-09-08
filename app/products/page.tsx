"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProductGrid } from "@/components/products/product-grid"
import { ProductFilters } from "@/components/products/product-filters"
//import { AddProductDialog } from "@/components/products/add-product-dialog"
//import { PriceListManager } from "@/components/products/price-list-manager"
import { Button } from "@/components/ui/button"
import { Plus, Upload, List, LayoutGrid } from "lucide-react"

export default function ProductsPage() {
    // Client-side authentication check
    if (typeof window !== "undefined") {
      const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
      if (!isAuthenticated) {
        window.location.replace("/login");
        return null;
      }
    }
  const [brandFilter, setBrandFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [functionFilter, setFunctionFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "brand" | "category" | "price">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [view, setView] = useState<"list" | "grid">("grid")
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/products", { cache: "no-store", credentials: "include" });
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (!res.ok) throw new Error("Failed to load products");
        const json = await res.json();
        const list = (json?.data ?? []).map((p: any) => ({
          id: p.id ?? p._id,
          name: p.name,
          price: typeof p.price === "number" ? p.price : undefined,
          status: p.status ?? "",
          createdAt: p.createdAt ?? "",
        }));
        if (alive) setProducts(list);
      } catch (e: any) {
        if (alive) setError(e?.message ?? "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(q);
      return matchesSearch;
    });
  }, [products, searchQuery]);

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight  text-[oklch(35.04%_0.01007_216.95)]">Product Management</h1>
            <p className="text-[oklch(44.226%_0.00005_271.152)]  font-semibold">Manage your product catalog and pricing</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/products/add")} className="bg-[oklch(32.988%_0.05618_196.615)] text-white hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Filters and List/Grid Toggle in one line */}
        <div className="flex items-center justify-between gap-4 py-2">
          <div className="flex-1 min-w-0">
            <ProductFilters
              brandFilter={brandFilter}
              onBrandFilterChange={setBrandFilter}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              functionFilter={functionFilter}
              onFunctionFilterChange={setFunctionFilter}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
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
          <div className="text-center py-12"><div className="text-[oklch(0%_0_0)]">Loading products…</div></div>
        ) : error ? (
          <div className="text-center py-12"><div className="text-red-500">{error}</div></div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12"><div className="text-muted-foreground">No products found.</div></div>
        ) : view === "grid" ? (
          <ProductGrid
            brandFilter={brandFilter}
            categoryFilter={categoryFilter}
            functionFilter={functionFilter}
            searchQuery={searchQuery}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        ) : (
          <div className="overflow-x-auto rounded-md border shadow-sm bg-white/80">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-bold">Product Name</th>
                  <th className="px-4 py-3 font-bold">Price</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Created At</th>
                  <th className="px-4 py-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-muted/20 transition">
                    <td className="px-4 py-2 font-medium">{p.name}</td>
                    <td className="px-4 py-2">{typeof p.price === "number" ? `₹ ${p.price.toLocaleString()}` : "—"}</td>
                    <td className="px-4 py-2 capitalize">{p.status || "—"}</td>
                    <td className="px-4 py-2">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => router.push(`/products/${p.id}`)}
                        className="text-white border-blue-200 hover:bg-[oklch(32.988%_0.05618_196.615)]/50"
                      >
                        View
                      </Button>
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
