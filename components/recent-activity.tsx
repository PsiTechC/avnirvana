
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type BaseDoc = { _id: string; name?: string; createdAt?: string; updatedAt?: string }
type ProductDoc = BaseDoc & { sku?: string; brandId?: { name?: string } | string }
type BrandDoc = BaseDoc
type DealerDoc = BaseDoc
type OtherProductDoc = BaseDoc & { sku?: string }
type OtherBrandDoc = BaseDoc & { description?: string }
type QuotationDoc = { _id: string; quotationNumber?: string; createdAt?: string; updatedAt?: string; dealerId?: string; total?: number }

type Activity = {
  id: string
  kind: "product" | "brand" | "dealer" | "other-product" | "other-brand" | "quotation"
  action: "created" | "updated"
  title: string
  subtitle?: string
  when: string // ISO
}

function timeAgo(iso?: string) {
  if (!iso) return "—"
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleString()
}

export function RecentActivity() {
  const [data, setData] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
      ; (async () => {
        setLoading(true)
        setError(null)
        try {

          const [prodRes, brandRes, dealerRes, otherRes, otherBrandRes, quotationRes] = await Promise.all([
            fetch("/api/products", { cache: "no-store" }).then(r => r.json()).catch(() => ({ data: [] })),
            fetch("/api/brands", { cache: "no-store" }).then(r => r.json()).catch(() => ({ data: [] })),
            fetch("/api/dealers", { cache: "no-store" }).then(r => r.json()).catch(() => ({ data: [] })),
            fetch("/api/other-products", { cache: "no-store" }).then(r => r.json()).catch(() => ({ data: [] })),
            fetch("/api/other-brands", { cache: "no-store" }).then(r => r.json()).catch(() => ({ data: [] })),
            fetch("/api/quotations", { cache: "no-store" }).then(r => r.json()).catch(() => ({ data: [] })),
          ])

          const prodActs: Activity[] = (prodRes?.data ?? []).map((p: ProductDoc) => {
            const updated = p.updatedAt && p.createdAt && p.updatedAt !== p.createdAt
            return {
              id: p._id,
              kind: "product",
              action: updated ? "updated" : "created",
              title: p.name ?? "Unnamed product",
              subtitle: [p.sku, typeof p.brandId === "object" && p.brandId?.name ? p.brandId.name : undefined]
                .filter(Boolean)
                .join(" • "),
              when: (updated ? p.updatedAt : p.createdAt) ?? p.updatedAt ?? p.createdAt ?? new Date().toISOString(),
            }
          })

          const brandActs: Activity[] = (brandRes?.data ?? []).map((b: BrandDoc) => ({
            id: b._id,
            kind: "brand",
            action: "created",
            title: b.name ?? "New brand",
            subtitle: "Brand added",
            when: b.createdAt ?? new Date().toISOString(),
          }))

          const dealerActs: Activity[] = (dealerRes?.data ?? []).map((d: DealerDoc) => ({
            id: d._id,
            kind: "dealer",
            action: "created",
            title: d.name ?? "New dealer",
            subtitle: "Dealer added",
            when: d.createdAt ?? new Date().toISOString(),
          }))

          const otherActs: Activity[] = (otherRes?.data ?? []).map((o: OtherProductDoc) => ({
            id: o._id,
            kind: "other-product",
            action: (o.updatedAt && o.createdAt && o.updatedAt !== o.createdAt) ? "updated" : "created",
            title: o.name ?? "Other product",
            subtitle: o.sku ? `SKU: ${o.sku}` : undefined,
            when: (o.updatedAt && o.updatedAt !== o.createdAt) ? o.updatedAt! : (o.createdAt ?? new Date().toISOString()),
          }))


          // Other Brand Activity
          const otherBrandActs: Activity[] = (otherBrandRes?.data ?? []).map((b: OtherBrandDoc) => ({
            id: b._id,
            kind: "other-brand",
            action: "created",
            title: b.name ?? "Other brand",
            subtitle: b.description ? b.description : undefined,
            when: b.createdAt ?? new Date().toISOString(),
          }))

          // Quotation Activity
          const quotationActs: Activity[] = (quotationRes?.data ?? []).map((q: QuotationDoc) => {
            const updated = q.updatedAt && q.createdAt && q.updatedAt !== q.createdAt;
            return {
              id: q._id,
              kind: "quotation",
              action: updated ? "updated" : "created",
              title: q.quotationNumber ? `Quotation #${q.quotationNumber}` : "Quotation",
              subtitle: q.total !== undefined ? `Total: ₹${q.total}` : undefined,
              when: (updated ? q.updatedAt : q.createdAt) ?? q.updatedAt ?? q.createdAt ?? new Date().toISOString(),
            }
          })

          const merged = [
            ...prodActs,
            ...brandActs,
            ...dealerActs,
            ...otherActs,
            ...otherBrandActs,
            ...quotationActs,
          ]
            .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
            .slice(0, 100) // keep up to latest 100 entries

          if (!cancelled) setData(merged)
        } catch (e: any) {
          if (!cancelled) setError(e?.message ?? "Failed to load activity")
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    return () => { cancelled = true }
  }, [])

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="font-semibold">Recent Activity</CardTitle>
        <p className="text-xs font-semibold text-muted-foreground mt-0">
          Latest updates and changes.</p>
      </CardHeader>

      <CardContent>
        {loading && <div className="text-muted-foreground">Loading…</div>}
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {!loading && !error && data.length === 0 && (
          <div className="text-sm text-muted-foreground">No recent events yet.</div>
        )}

        {!loading && !error && data.length > 0 && (
          // SCROLL CONTAINER — tweak max-h to taste (e.g., max-h-64/80/96)
          <div className="max-h-45 overflow-y-auto pr-2">
            <ul className="space-y-0.5">
              {data.map((a) => (
                <li
                  key={`${a.kind}-${a.id}`}
                  className="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0"
                >
                  <div>
                    <div className="font-semibold">
                      {a.kind === "product" && (a.action === "created" ? "Product added" : "Product updated")}
                      {a.kind === "brand" && "Brand added"}
                      {a.kind === "dealer" && "Dealer added"}
                      {a.kind === "other-product" && (a.action === "created" ? "Other product added" : "Other product updated")}
                      {a.kind === "other-brand" && "Other brand added"}
                      {a.kind === "quotation" && (a.action === "created" ? "Quotation created" : "Quotation updated")}
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold">{a.title}</span>
                      {a.subtitle ? <span className="text-muted-foreground"> — {a.subtitle}</span> : null}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(a.when)}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
