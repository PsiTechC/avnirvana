

// app/page.tsx
"use client"

type Brand = { id: string; name: string }

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select as SelectComponent, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
// Use SelectComponent to avoid name clash with Select from shadcn/ui
const Select = Object.assign(SelectComponent, {
  Trigger: SelectTrigger,
  Value: SelectValue,
  Content: SelectContent,
  Item: SelectItem,
})
type Product = {
  _id?: string
  id?: string
  name: string
  brandId?: string
  brand?: { _id?: string; id?: string; name?: string }
  brandName?: string
  description?: string
  specification?: string
  status?: "active" | "inactive" | string | boolean
}

export default function ProductsIndexPage() {
  const router = useRouter()

  // search
  const [q, setQ] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBrand, setSelectedBrand] = useState<string>("all")

  // --- helpers
  const normalizeId = (x?: string) => x ?? ""
  const nameById = (id?: string) => {
    if (!id) return undefined
    return brands.find(b => b.id === id)?.name
  }
  const productBrandName = (p: Product) =>
    p.brandName ??
    p.brand?.name ??
    nameById(p.brand?._id ?? p.brand?.id ?? p.brandId) ??
    "—"

  const productStatusLabel = (s: Product["status"]) => {
    if (s === true || s === "active") return "Active"
    if (s === false || s === "inactive") return "Inactive"
    return typeof s === "string" ? s : "—"
  }

  // --- fetchers
  const loadBrands = async () => {
    const res = await fetch("/api/brands", { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to load brands")
    const { data } = await res.json()
    const list: Brand[] = (data ?? []).map((b: any) => ({
      id: normalizeId(b._id ?? b.id),
      name: b.name ?? "",
    }))
    setBrands(list)
  }

  const loadProducts = async () => {
    const res = await fetch("/api/products", { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to load products")
    const { data } = await res.json()
    const list: Product[] = (data ?? []).map((p: any) => ({
      _id: p._id,
      id: p.id ?? p._id,
      name: p.name,
      brandId: p.brandId ?? p.brand?._id ?? p.brand?.id,
      brand: p.brand ?? p.brandName ?? p.brand, // fallback for legacy
      brandName: p.brand ?? p.brandName ?? p.brand, // use 'brand' field from API
      description: p.description ?? "",
      specification: p.specification ?? "",
      status: p.status,
    }))
    setProducts(list)
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([loadBrands(), loadProducts()])
      .catch((e: any) => setError(e?.message ?? "Failed to fetch data"))
      .finally(() => setLoading(false))
  }, [])

  // Brand and search filter
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    let filteredProducts = products
    if (selectedBrand && selectedBrand !== "all") {
      filteredProducts = filteredProducts.filter((p) => {
        // p.brandId may be string or object
        let pid: string | undefined = undefined;
        if (typeof p.brandId === "string") pid = p.brandId;
        else if (typeof p.brandId === "object" && p.brandId !== null) pid = (p.brandId as any)._id || (p.brandId as any).id;
        return pid === selectedBrand;
      })
    }
    if (!query) return filteredProducts
    return filteredProducts.filter((p) => {
      return (
        p.name?.toLowerCase().includes(query) ||
        productBrandName(p)?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.specification?.toLowerCase().includes(query)
      )
    })
  }, [products, q, brands, selectedBrand])

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header + Search */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-[oklch(35.04%_0.01007_216.95)]">Products</h1>
          <div className="flex items-center gap-2 w-full max-w-2xl">
            <div className="w-48">
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <Select.Trigger className="w-full">
                  <Select.Value placeholder="Filter by brand" />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="all">All Brands</Select.Item>
                  {brands.map((b) => (
                    <Select.Item key={b.id} value={b.id}>{b.name}</Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0%_0_0)] h-4 w-4" />
              <Input
                placeholder="Search products by name, brand, description, specification…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <Card className="border-border  bg-[oklch(98%_0.01_220)]/80">
          <CardHeader>
            <CardTitle>Product Catalog</CardTitle>
            {/* GST always 18% per your spec */}
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-red-500">{error}</div>
            ) : loading ? (
              <div className="text-muted-foreground">Loading…</div>
            ) : filtered.length === 0 ? (
                  <div className="text-[oklch(44.226%_0.00005_271.152)] font-semibold ">No products found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                        <thead className="text-centre text-[oklch(35.04%_0.01007_216.95)]">
                    <tr className="[&>th]:py-2 [&>th]:px-1.5 border-b">
                      <th className="w-14">S No.</th>
                      <th className="w-15">Product</th>
                      <th className="w-15">Brand</th>
                      <th>GST %</th>
                      <th>Active/Inactive</th>
                      <th className="w-[15rem]">Specification</th>
                      <th className="w-[15rem]">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p, i) => (
                      <tr key={p.id ?? p._id ?? i} className="[&>td]:py-3 [&>td]:px-3 border-b">
                        <td>{i + 1}</td>
                        <td className="font-medium">{p.name || "—"}</td>
                        <td>{productBrandName(p)}</td>
                        <td>18%</td>
                        <td>
                          <span
                            className={
                              productStatusLabel(p.status) === "Active"
                                ? "rounded bg-emerald-500/10 text-emerald-600 px-2 py-0.5"
                                : "rounded bg-zinc-500/10 text-zinc-600 px-2 py-0.5"
                            }
                          >
                            {productStatusLabel(p.status)}
                          </span>
                        </td>

                        {/* Scrollable long text cells */}
                        <td>
                          <div className="max-h-32 overflow-y-auto rounded border p-2 bg-muted/30 whitespace-pre-line break-words w-[15rem]">
                            {p.specification?.trim() ? p.specification : "—"}
                          </div>
                        </td>
                        <td>
                          <div className="max-h-32 overflow-y-auto rounded border p-2 bg-muted/30 whitespace-pre-line break-words w-[15rem]">
                            {p.description?.trim() ? p.description : "—"}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
