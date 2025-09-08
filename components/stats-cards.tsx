
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Package, Users, FileText } from "lucide-react"

type AnyDoc = {
  _id?: string
  name?: string
  status?: string // "active" | "inactive" (any case)
}

type QuoteDoc = {
  _id?: string
  status?: string
}

function splitCounts<T extends { status?: string }>(rows: T[] | undefined) {
  const list = Array.isArray(rows) ? rows : []
  const norm = (s?: string) => (s || "").toLowerCase()
  const active = list.filter((r) => norm(r.status) === "active").length
  const inactive = list.filter((r) => norm(r.status) === "inactive").length
  return { total: list.length, active, inactive }
}

export function StatsCards() {
  const [brands, setBrands] = useState<AnyDoc[] | null>(null)
  const [otherBrands, setOtherBrands] = useState<AnyDoc[] | null>(null)
  const [products, setProducts] = useState<AnyDoc[] | null>(null)
  const [dealers, setDealers] = useState<AnyDoc[] | null>(null)
  const [quotes, setQuotes] = useState<QuoteDoc[] | null>(null) // optional
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
      ; (async () => {
        setLoading(true)
        try {
          const [b, ob, p, d, q] = await Promise.all([
            fetch("/api/brands", { cache: "no-store" }).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
            fetch("/api/other-brands", { cache: "no-store" }).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
            fetch("/api/products", { cache: "no-store" }).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
            fetch("/api/dealers", { cache: "no-store" }).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
            // quotations endpoint may not exist — treat as optional
            fetch("/api/quotations", { cache: "no-store" })
              .then(r => (r.ok ? r.json() : { data: [] }))
              .catch(() => ({ data: [] })),
          ])
          if (cancelled) return
          setBrands(b?.data ?? [])
          setOtherBrands(ob?.data ?? [])
          setProducts(p?.data ?? [])
          setDealers(d?.data ?? [])
          setQuotes(q?.data ?? null) // if it's truly missing, keep null to show "—"
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    return () => { cancelled = true }
  }, [])

  const brandCounts = useMemo(() => splitCounts(brands || []), [brands])
  const otherBrandCounts = useMemo(() => splitCounts(otherBrands || []), [otherBrands])
  const productCounts = useMemo(() => splitCounts(products || []), [products])
  const dealerCounts = useMemo(() => splitCounts(dealers || []), [dealers])
  const quoteCounts = useMemo(() => (quotes ? splitCounts(quotes) : null), [quotes])

  const fmt = (n: number | string) => (typeof n === "number" ? n.toLocaleString() : n)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Brands */}
      <Card
        className="hover:shadow-lg bg-white border-1"
        onClick={() => router.push("/brands")}
        tabIndex={0}
        role="button"
        aria-label="Go to Brands"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
          <CardTitle className="text-sm font-semibold ">Brands</CardTitle>
          <Building2 className="h-5 w-5 text-chart-1" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold ">
            {loading ? "…" : fmt(brandCounts.total)}
          </div>
          <p className="text-s text-muted-foreground mt-1">
            {loading ? "Loading…" : `${fmt(brandCounts.active)} Active, ${fmt(brandCounts.inactive)} Inactive`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
           Manage your brand and status</p>
        </CardContent>
      </Card>

      {/* Products */}
      <Card
        className="hover:shadow-lg bg-white border-1"
        onClick={() => router.push("/products")}
        tabIndex={0}
        role="button"
        aria-label="Go to Products"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
          <CardTitle className="text-sm font-semibold ">Products</CardTitle>
          <Package className="h-5 w-5 text-chart-2" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold ">
            {loading ? "…" : fmt(productCounts.total)}
          </div>
          <p className="text-s text-muted-foreground mt-1">
            {loading ? "Loading…" : `${fmt(productCounts.active)} Active, ${fmt(productCounts.inactive)} Inactive`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your product catalog and pricing</p>
        </CardContent>
      </Card>

      {/* Dealers */}
      <Card
        className="hover:shadow-lg bg-white border-1"
        onClick={() => router.push("/dealers")}
        tabIndex={0}
        role="button"
        aria-label="Go to Dealers"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
          <CardTitle className="text-sm font-semibold ">Dealers</CardTitle>
          <Users className="h-5 w-5 text-chart-3" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold ">
            {loading ? "…" : fmt(dealerCounts.total)}
          </div>
          <p className="text-s text-muted-foreground mt-1">
            {loading ? "Loading…" : `${fmt(dealerCounts.active)} Active, ${fmt(dealerCounts.inactive)} Inactive`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your dealer network and partnerships</p>
        </CardContent>
      </Card>

      {/* Quotations (optional) */}
      <Card
        className="hover:shadow-lg bg-white  border-1"
        onClick={() => router.push("/quotations")}
        tabIndex={0}
        role="button"
        aria-label="Go to Quotations"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
          <CardTitle className="text-sm font-semibold ">Quotations</CardTitle>
          <FileText className="h-5 w-5 text-chart-4" />
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold ">
            {loading ? "…" : (quoteCounts ? fmt(quoteCounts.total) : "—")}
          </div>
          <p className="text-s text-muted-foreground mt-1">
            {loading
              ? "Loading…"
              : quoteCounts
                ? `${fmt(quoteCounts.active)} Active, ${fmt(quoteCounts.inactive)} Inactive`
                : "Not available"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your quotations.</p>
        </CardContent>
      </Card>
    </div>
  )
}
