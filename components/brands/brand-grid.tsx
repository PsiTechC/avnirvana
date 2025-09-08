"use client"

import { useEffect, useMemo, useState } from "react"
import { BrandCard } from "./brand-card"
// import { EditBrandDialog } from "./edit-brand-dialog"
import { DeleteBrandDialog } from "./delete-brand-dialog"

type BrandUI = {
  id: string
  name: string
  description?: string
  logoUrl?: string
  websiteUrl?: string
  status: "active" | "inactive"
  productsCount?: number
  createdAt: string
}

interface BrandGridProps {
  statusFilter: "all" | "active" | "inactive"
  searchQuery: string
  reloadKey?: number
}

export function BrandGrid({ statusFilter, searchQuery, reloadKey = 0 }: BrandGridProps) {
  const [brands, setBrands] = useState<BrandUI[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingBrand, setEditingBrand] = useState<BrandUI | null>(null)
  const [deletingBrand, setDeletingBrand] = useState<BrandUI | null>(null)

  // fetch list
  useEffect(() => {
    let alive = true
      ; (async () => {
        setIsLoading(true)
        setError(null)
        try {
          const res = await fetch("/api/brands", { cache: "no-store" })
          if (!res.ok) throw new Error("Failed to load brands")
          const json = await res.json()
          const list: BrandUI[] = (json?.data ?? []).map((b: any) => ({
            id: b.id ?? b._id,
            name: b.name,
            description: b.description ?? "",
            logoUrl: b.logoUrl ?? "",
            websiteUrl: b.websiteUrl ?? "",
            status: b.status === "inactive" ? "inactive" : "active",
            productsCount: typeof b.productsCount === "number" ? b.productsCount : 0,
            createdAt: b.createdAt ?? new Date().toISOString(),
          }))
          if (alive) setBrands(list)
        } catch (e: any) {
          if (alive) setError(e?.message ?? "Failed to load")
        } finally {
          if (alive) setIsLoading(false)
        }
      })()
    return () => { alive = false }
  }, [reloadKey])

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return brands.filter((brand) => {
      const matchesStatus = statusFilter === "all" || brand.status === statusFilter
      const matchesSearch =
        brand.name.toLowerCase().includes(q) ||
        (brand.description ?? "").toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [brands, statusFilter, searchQuery])

  // EDIT (PATCH)
  const handleEdit = async (updated: BrandUI) => {
    try {
      const res = await fetch(`/api/brands/${updated.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updated.name,
          description: updated.description ?? "",
          websiteUrl: updated.websiteUrl ?? "",
          status: updated.status,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Update failed")
      }
      const { data } = await res.json()
      setBrands((prev) =>
        prev.map((b) => (b.id === updated.id ? { ...b, ...updated, ...mapApiBrand(data) } : b))
      )
    } catch (e) {
      // TODO: surface toast
      console.error(e)
    } finally {
      setEditingBrand(null)
    }
  }

  // DELETE
  const handleDelete = async (brandId: string) => {
    try {
      const res = await fetch(`/api/brands/${brandId}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Delete failed")
      }
      setBrands((prev) => prev.filter((b) => b.id !== brandId))
    } catch (e) {
      // TODO: surface toast
      console.error(e)
    } finally {
      setDeletingBrand(null)
    }
  }

  // helper to map API brand back to UI if server returns fresh doc
  function mapApiBrand(b: any): Partial<BrandUI> {
    if (!b) return {}
    return {
      name: b.name,
      description: b.description ?? "",
      websiteUrl: b.websiteUrl ?? "",
      status: b.status === "inactive" ? "inactive" : "active",
      logoUrl: b.logoUrl ?? "",
      productsCount: typeof b.productsCount === "number" ? b.productsCount : undefined,
      createdAt: b.createdAt ?? undefined,
    }
  }

  if (isLoading) return <div className="text-center py-12"><div className="text-[oklch(0%_0_0)]">Loading brands…</div></div>
  if (error) return <div className="text-center py-12"><div className="text-red-500">{error}</div></div>
  if (filtered.length === 0) return (
    <div className="text-center py-12">
      <div className="text-muted-foreground">
        {searchQuery ? "No brands found matching your search." : "No brands found."}
      </div>
    </div>
  )

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((brand) => (
          <BrandCard
            key={brand.id}
            brand={brand}
            onStatusToggle={() =>
              setEditingBrand({ ...brand, status: brand.status === "active" ? "inactive" : "active" })
            }
            onEdit={() => setEditingBrand(brand)}
            onDelete={() => setDeletingBrand(brand)}
          />
        ))}
      </div>

      {/* EDIT */}
      {/* <EditBrandDialog
        brand={editingBrand}
        open={!!editingBrand}
        onOpenChange={(open) => !open && setEditingBrand(null)}
        onSave={(b) => handleEdit(b)}
      /> */}

      {/* DELETE */}
      <DeleteBrandDialog
        brand={deletingBrand}
        open={!!deletingBrand}
        onOpenChange={(open) => !open && setDeletingBrand(null)}
        onConfirm={() => deletingBrand && handleDelete(deletingBrand.id)}
      />
    </>
  )
}
