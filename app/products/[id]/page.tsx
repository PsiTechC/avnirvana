// app/products/[id]/page.tsx
"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2 } from "lucide-react"
import Image from "next/image"
import { EditProductDialog } from "@/components/products/edit-product-dialog"
import { DeleteProductDialog } from "@/components/products/delete-product-dialog"
import React from "react";


//import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type PriceRow = {
  _id: string
  productId: string
  price?: number | null
  isPOR?: boolean
  note?: string
  effectiveFrom?: string   // ISO
  effectiveTo?: string | null
  createdAt?: string
}

function fmtDate(s?: string | null) {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(+d) ? "—" : d.toLocaleString()
}

function money(n?: number | null) {
  if (typeof n !== "number") return "—"
  return `₹ ${n.toFixed(2)}`
}

function PriceHistorySection({ productId }: { productId: string }) {
  const [rows, setRows] = React.useState<PriceRow[] | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let alive = true
      ; (async () => {
        setLoading(true)
        setError(null)
        try {
          // Try kebab-case route first, then snake_case as a fallback.
          const tryUrls = [
            `/api/product-price-list?productId=${encodeURIComponent(productId)}`,
            `/api/product_price_list?productId=${encodeURIComponent(productId)}`
          ]
          let data: any = null, ok = false
          for (const url of tryUrls) {
            const res = await fetch(url, { cache: "no-store" })
            if (res.ok) {
              const json = await res.json()
              data = json?.data ?? json
              ok = true
              break
            }
          }
          if (!ok) throw new Error("No price list endpoint responded 200")

          const out: PriceRow[] = (Array.isArray(data) ? data : []).map((r: any) => ({
            _id: r._id ?? crypto.randomUUID(),
            productId: r.productId ?? r.product ?? "",
            price: typeof r.price === "number" ? r.price : null,
            isPOR: !!r.isPOR,
            note: r.note ?? "",
            effectiveFrom: r.effectiveFrom ?? r.startDate ?? r.createdAt ?? null,
            effectiveTo: r.effectiveTo ?? r.endDate ?? null,
            createdAt: r.createdAt ?? null,
          }))

          // Sort newest first by effectiveFrom (fallback createdAt)
          out.sort((a, b) => {
            const aT = +new Date(a.effectiveFrom ?? a.createdAt ?? 0)
            const bT = +new Date(b.effectiveFrom ?? b.createdAt ?? 0)
            return bT - aT
          })

          if (alive) setRows(out)
        } catch (e: any) {
          if (alive) setError(e?.message ?? "Failed to load price history")
        } finally {
          if (alive) setLoading(false)
        }
      })()
    return () => { alive = false }
  }, [productId])

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="font-bold">Price History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : !rows || rows.length === 0 ? (
          <div className="text-muted-foreground">No price changes recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left border-b">
                <tr className="[&>th]:py-2">
                  <th>Effective From</th>
                  <th>Effective Till</th>
                  <th>Price</th>
                  {/* <th>Note</th> */}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r._id} className="border-b last:border-0 align-top">
                    <td className="py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {fmtDate(r.effectiveFrom)}
                        {i === 0 && <Badge variant="secondary">Current</Badge>}
                      </div>
                    </td>
                    <td className="py-2 whitespace-nowrap">{fmtDate(r.effectiveTo)}</td>
                    <td className="py-2">
                      {r.isPOR ? <Badge className="bg-amber-100 text-amber-800">POR</Badge> : money(r.price)}
                    </td>
                    {/* <td className="py-2 max-w-[28rem]">
                      <div className="text-muted-foreground whitespace-pre-wrap break-words">{r.note || "—"}</div>
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


// Helpers (put near imports)
const asName = (v: any): string =>
  typeof v === "string" ? v : (v?.name ?? "")

const asNameArray = (arr: any): string[] =>
  Array.isArray(arr)
    ? arr
      .map((x: any) => (typeof x === "string" ? x : (x?.name ?? "")))
      .filter(Boolean)
    : []

// Product type
interface Product {
  id: string
  name: string
  description?: string
  specification?: string
  brand?: string
  brandId?: string
  category?: string
  categoryId?: string
  function?: string
  functionId?: string
  categories?: string[]
  functions?: string[]
  price?: number
  isPOR?: boolean
  //sku?: string
  status?: string
  //stockLevel?: number
  images?: string[]
  mainImage?: string
  createdAt?: string
  priceHistory?: { price: number; date: string }[]
  gstPercent?: number
  isNewProduct?: boolean
}

export default function ProductDetailsPage() {
  // Dialog state
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  // Edit handler
  const handleSaveEdit = async (edited: Product) => {
    if (!product) return
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: edited.name,
          description: edited.description ?? "",
          specification: edited.specification ?? "",
          brandId: edited.brandId ?? "",
          categoryId: edited.categoryId ?? "",
          functionId: edited.functionId ?? "",
          price: edited.price ?? 0,
          isPOR: !!edited.isPOR,
         // sku: edited.sku ?? "",
          status: edited.status ?? "active",
          //stockLevel: edited.stockLevel ?? 0,
        }),
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Update failed")
      }
      const { data } = await res.json()
      setProduct((prev) => prev ? { ...prev, ...data } : prev)
    } catch (e) {
      console.error(e)
    } finally {
      setEditing(false)
    }
  }

  // Delete handler
  const handleConfirmDelete = async () => {
    if (!product) return
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Delete failed")
      }
      router.push("/products")
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(false)
    }
  }
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const productId = params?.id

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!productId) return
    let alive = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/products/${productId}`, { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load product")
        const { data } = await res.json()
        const mapped: Product = {
          id: data._id ?? data.id,
          name: data.name,
          description: data.description ?? "",
          specification: data.specification ?? "",
          brand: asName(data.brand) || asName(data.brandId),
          brandId: typeof data.brandId === "string" ? data.brandId : (data.brandId?._id ?? ""),
          categories: asNameArray(data.categories),
          functions: asNameArray(data.functions), 
          price: typeof data.price === "number" ? data.price : undefined,
          isPOR: !!data.isPOR,
          status: data.status ?? "",
          images: Array.isArray(data.images) ? data.images : [],
          mainImage: data.mainImage ?? "",
          createdAt: data.createdAt ?? "",
          priceHistory: Array.isArray(data.priceHistory) ? data.priceHistory : [],
          gstPercent: typeof data.gstPercent === "number" ? data.gstPercent : undefined,
          isNewProduct: !!data.isNewProduct,
        }
        if (alive) setProduct(mapped)
      } catch (e: any) {
        if (alive) setError(e?.message ?? "Failed to load product")
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [productId])

  const created = useMemo(() => (product?.createdAt ? new Date(product.createdAt) : null), [product])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-muted-foreground">Loading product…</div>
      </DashboardLayout>
    )
  }

  if (error || !product) {
    return (
      <DashboardLayout>
        <div className="p-6 text-red-500">{error || "Product not found"}</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[oklch(35.04%_0.01007_216.95)] ">{product.name}</h1>
            <p className="text-sm font-semibold text-[oklch(44.226%_0.00005_271.152)] ">
              {product.status?.toUpperCase()} • {created ? created.toLocaleDateString() : "—"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="default" onClick={() => router.push(`/products/${product.id}/edit`)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setDeleting(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
  
      <EditProductDialog
        product={product as any}
        open={editing}
        onOpenChange={setEditing}
        onSave={(p) => handleSaveEdit(p as any)}
      />
      <DeleteProductDialog
        product={product as any}
        open={deleting}
        onOpenChange={setDeleting}
        onConfirm={handleConfirmDelete}
      />

      

        <Card className=" bg-[oklch(98%_0.01_220)]/80">
          <CardHeader>
            <CardTitle className="font-bold">Product Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-3">
              {/* Left: details */}
              <div className="md:col-span-2 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1">
                    <span className="font-bold">Brand:</span> {product.brand || "—"}
                  </div>
                  <div className="grid gap-1">
                    <span className="font-bold">Price:</span> {product.isPOR ? "POR" : product.price?.toLocaleString() || "—"}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1">
                    <span className="font-bold">GST %:</span> {typeof product.gstPercent === "number" ? product.gstPercent : "—"}
                  </div>
                  <div className="grid gap-1">
                    <span className="font-bold">Is New Product:</span> {product.isNewProduct ? "Yes" : "No"}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1">
                    <span className="font-bold">Category:</span> {product.categories && product.categories.length > 0 ? product.categories.join(", ") : "—"}
                  </div>
                  <div className="grid gap-1">
                    <span className="font-bold">Function:</span> {product.functions && product.functions.length > 0 ? product.functions.join(", ") : "—"}
                  </div>
                </div>
                <div className="grid gap-1">
                  <span className="font-bold">Description:</span>
                  <div className="max-h-32  overflow-y-auto rounded bg-white/10 p-2">
                    <p className="text-sm  leading-relaxed whitespace-pre-wrap">{product.description || "—"}</p>
                  </div>
                </div>
                <div className="grid gap-1">
                  <span className="font-bold">Specification:</span>
                  <div className="max-h-32 overflow-y-auto rounded bg-white/10 p-2">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{product.specification || "—"}</p>
                  </div>
                </div>
              </div>
              {/* Right: images */}
              <aside className="md:col-span-1">
                <div className="rounded-lg border bg-muted/20 p-3 flex flex-wrap gap-3">
                  {product.images && product.images.length > 0 ? (
                    product.images.map((img, idx) => (
                      <div key={idx} className="relative" style={{height:180, width:180}}>
                        <Image
                          src={img}
                          alt={product.name + " image " + (idx + 1)}
                          fill
                          sizes="180px"
                          className="object-contain rounded-lg border bg-white"
                          style={{background: '#fff'}}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      No image
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </CardContent>
        </Card>

        {/* Price history */}
        <div className="mt-6">
          <PriceHistorySection productId={String(productId)} />
        </div>

      </div>
    </DashboardLayout>
  )
}
