
"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ArrowUpDown } from "lucide-react"

interface ProductFiltersProps {
  brandFilter: string
  onBrandFilterChange: (filter: string) => void
  categoryFilter: string
  onCategoryFilterChange: (filter: string) => void
  functionFilter: string
  onFunctionFilterChange: (filter: string) => void
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  sortBy: "name" | "brand" | "category" | "price"
  onSortByChange: (sort: "name" | "brand" | "category" | "price") => void
  sortOrder: "asc" | "desc"
  onSortOrderChange: (order: "asc" | "desc") => void
}

type Lite = { id: string; name: string }

export function ProductFilters({
  brandFilter,
  onBrandFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  functionFilter,
  onFunctionFilterChange,
  searchQuery,
  onSearchQueryChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: ProductFiltersProps) {
  const [brands, setBrands] = useState<Lite[]>([])
  const [categories, setCategories] = useState<Lite[]>([])
  const [functions, setFunctions] = useState<Lite[]>([])

  const [loading, setLoading] = useState({ brands: true, categories: true, functions: true })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancel = false

    const load = async () => {
      setError(null)
      try {
        // Brands
        ; (async () => {
          try {
            const r = await fetch("/api/brands", { cache: "no-store" })
            if (!r.ok) throw new Error("Failed to load brands")
            const j = await r.json()
            const list: Lite[] = (j?.data ?? []).map((b: any) => ({ id: b._id, name: b.name }))
            if (!cancel) setBrands(list)
          } catch (e: any) {
            if (!cancel) setError(e?.message ?? "Failed to load brands")
          } finally {
            if (!cancel) setLoading((s) => ({ ...s, brands: false }))
          }
        })()

          // Categories
          ; (async () => {
            try {
              const r = await fetch("/api/product-categories", { cache: "no-store" })
              if (!r.ok) throw new Error("Failed to load categories")
              const j = await r.json()
              const list: Lite[] = (j?.data ?? []).map((c: any) => ({ id: c._id, name: c.name }))
              if (!cancel) setCategories(list)
            } catch (e: any) {
              if (!cancel) setError((prev) => prev ?? e?.message ?? "Failed to load categories")
            } finally {
              if (!cancel) setLoading((s) => ({ ...s, categories: false }))
            }
          })()

          // Functions
          ; (async () => {
            try {
              const r = await fetch("/api/product-function", { cache: "no-store" })
              if (!r.ok) throw new Error("Failed to load functions")
              const j = await r.json()
              const list: Lite[] = (j?.data ?? []).map((f: any) => ({ id: f._id, name: f.name }))
              if (!cancel) setFunctions(list)
            } catch (e: any) {
              if (!cancel) setError((prev) => prev ?? e?.message ?? "Failed to load functions")
            } finally {
              if (!cancel) setLoading((s) => ({ ...s, functions: false }))
            }
          })()
      } catch {
        // no-op: individual blocks set error
      }
    }

    load()
    return () => {
      cancel = true
    }
  }, [])

  const isBrandsLoading = loading.brands
  const isCategoriesLoading = loading.categories
  const isFunctionsLoading = loading.functions

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-4">
          {/* Brand */}
          <Select
            value={brandFilter}
            onValueChange={onBrandFilterChange}
            disabled={isBrandsLoading}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={isBrandsLoading ? "Loading brands..." : "All Brands"} />
            </SelectTrigger>
            <SelectContent style={{ maxHeight: "220px", overflowY: "auto" }}>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category */}
          <Select
            value={categoryFilter}
            onValueChange={onCategoryFilterChange}
            disabled={isCategoriesLoading}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={isCategoriesLoading ? "Loading categories..." : "All Categories"} />
            </SelectTrigger>
            <SelectContent style={{ maxHeight: "220px", overflowY: "auto" }}>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Function */}
          <Select
            value={functionFilter}
            onValueChange={onFunctionFilterChange}
            disabled={isFunctionsLoading}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={isFunctionsLoading ? "Loading functions..." : "All Functions"} />
            </SelectTrigger>
            <SelectContent style={{ maxHeight: "220px", overflowY: "auto" }}>
              <SelectItem value="all">All Functions</SelectItem>
              {functions.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[oklch(0%_0_0)]">Sort by:</span>
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="brand">Brand</SelectItem>
              <SelectItem value="category">Category</SelectItem>
              <SelectItem value="price">Price</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="default"
            size="sm"
            onClick={() => onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")}
            title="Toggle sort order"
          >
            <ArrowUpDown className="h-4 w-4 mr-1" />
            {sortOrder === "asc" ? "A-Z" : "Z-A"}
          </Button>
        </div>

        <div className="relative w-full lg:w-50">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0%_0_0)] h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
