"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FileText, Calendar, User, Mail, Phone, Package, DollarSign } from "lucide-react"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem
} from "@/components/ui/select"

// Keep types permissive to match API/DB variations
export type QuotationItem = {
  id?: string
  _id?: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  total?: number
}

export type Quotation = {
  id?: string
  _id?: string
  quotationNumber: string
  dealerName?: string
  dealerId?: string
  contactPerson?: string
  email?: string
  phone?: string
  status: "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired"
  createdDate?: string
  createdAt?: string
  validUntil: string
  items?: QuotationItem[]
  areas?: {
    areaRoomTypeId: string
    areaRoomTypeName: string
    items: QuotationItem[]
  }[]
  subtotal?: number
  tax?: number
  discount?: number
  total?: number
  notes?: string
  templateId?: string
  // Some APIs may return nested dealer
  dealer?: {
    _id?: string
    id?: string
    name?: string
    contactPerson?: string
    email?: string
    phone?: string
  }
}

interface ViewQuotationDialogProps {
  /** You can pass the whole row from the card, or just the id */
  quotation?: Quotation | null
  id?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Dealer = {
  _id?: string
  id?: string
  name?: string
  contactPerson?: string
  email?: string
  phone?: string
}

function statusBadge(status: Quotation["status"]) {
  switch (status) {
    case "Draft": return "bg-gray-100 text-gray-800"
    case "Sent": return "bg-blue-100 text-blue-800"
    case "Accepted": return "bg-green-100 text-green-800"
    case "Rejected": return "bg-red-100 text-red-800"
    case "Expired": return "bg-orange-100 text-orange-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

function isExpired(iso?: string) {
  if (!iso) return false
  const d = new Date(iso)
  return Number.isFinite(d.getTime()) && d.getTime() < Date.now()
}

export default function ViewQuotationDialog({ quotation, id, open, onOpenChange }: ViewQuotationDialogProps) {
  const [data, setData] = useState<Quotation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(quotation?.templateId)

  const targetId = useMemo(() => quotation?._id || quotation?.id || id || null, [quotation, id])

  useEffect(() => {
    if (!open || !targetId) return
    let abort = false
    ;(async () => {
      setLoading(true); setError(null)
      try {
        // 1) Fetch the quotation detail
        const res = await fetch(`/api/quotations/${targetId}`, { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load quotation")
        const json = await res.json()
        let q: Quotation | null = json?.data ?? null
        if (!q) throw new Error("Quotation not found")

        // 2) If API returns nested dealer/client, lift into flat fields
        const nested: Dealer | undefined = (q as any).dealer || (q as any).client
        if (nested) {
          q = {
            ...q,
            dealerId: q.dealerId ?? nested._id ?? nested.id,
            dealerName: q.dealerName ?? nested.name,
            contactPerson: q.contactPerson ?? nested.contactPerson,
            email: q.email ?? nested.email,
            phone: q.phone ?? nested.phone,
          }
        }

        // 3) If still missing dealerName but we have dealerId, fetch client (not dealer)
        if (!q.dealerName && q.dealerId) {
          const cRes = await fetch(`/api/clients/${q.dealerId}`, { cache: "no-store" }).catch(() => null)
          if (cRes && cRes.ok) {
            const cJson = await cRes.json().catch(() => null)
            const c: Dealer | undefined = cJson?.data
            if (c) {
              q = {
                ...q,
                dealerName: c.name ?? q.dealerName,
                contactPerson: c.contactPerson ?? q.contactPerson,
                email: c.email ?? q.email,
                phone: c.phone ?? q.phone,
              }
            }
          }
        }

        if (!abort) setData(q)
      } catch (e: any) {
        if (!abort) setError(e?.message ?? "Could not load quotation")
      } finally {
        if (!abort) setLoading(false)
      }
    })()
    return () => { abort = true }
  }, [open, targetId])

  useEffect(() => {
    async function fetchTemplates() {
      const res = await fetch("/api/quotation-templates")
      const { data } = await res.json()
      setTemplates(data)
    }
    if (open) fetchTemplates()
  }, [open])

  useEffect(() => {
    setSelectedTemplateId(quotation?.templateId)
  }, [quotation])

  // Fallback to the light row we already had (so UI renders instantly),
  // then hydrate with full record once fetch completes
  const q = (data || quotation) as Quotation | null
  if (!q) return null

  const createdIso = q.createdAt || q.createdDate || ""
  const expired = isExpired(q.validUntil)
  const showStatus = expired && q.status !== "Accepted" && q.status !== "Rejected" ? "Expired" : q.status

  // Prefer area-based structure if present
  const areas = q.areas && Array.isArray(q.areas) && q.areas.length > 0 ? q.areas : null
  const items = areas
    ? areas.flatMap((area) => area.items.map((item) => ({ ...item, areaRoomTypeName: area.areaRoomTypeName })))
    : q.items || []
  const subtotal = Number(q.subtotal ?? items.reduce((s, it) => s + (Number(it.total ?? (it.quantity * it.unitPrice)) || 0), 0))
  const tax = Number(q.tax ?? subtotal * 0.18)
  const total = Number(q.total ?? subtotal + tax - Number(q.discount || 0))

  // Show all client fields if present
  const clientAddress = (q as any).address || (q.dealer as any)?.address
  const clientCity = (q as any).city || (q.dealer as any)?.city
  const clientZip = (q as any).zipCode || (q.dealer as any)?.zipCode
  const clientNotes = (q as any).notes || (q.dealer as any)?.notes

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{q.quotationNumber}</DialogTitle>
            <Badge className={statusBadge(showStatus)}>{showStatus}</Badge>
          </div>
        </DialogHeader>

        {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {error && <div className="text-sm text-red-500">{error}</div>}

        <div className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg  flex items-center">
                <User className="mr-2 h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold">{q.dealerName || "—"}</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {q.contactPerson && (
                    <div className="flex items-center"><User className="mr-2 h-4 w-4" />{q.contactPerson}</div>
                  )}
                  {q.email && (
                    <div className="flex items-center"><Mail className="mr-2 h-4 w-4" />{q.email}</div>
                  )}
                  {q.phone && (
                    <div className="flex items-center"><Phone className="mr-2 h-4 w-4" />{q.phone}</div>
                  )}
                  {clientAddress && (
                    <div className="flex items-center"><span className="mr-2">🏠</span>{clientAddress}</div>
                  )}
                  {clientCity && (
                    <div className="flex items-center"><span className="mr-2">🏙️</span>{clientCity}</div>
                  )}
                  {clientZip && (
                    <div className="flex items-center"><span className="mr-2">📮</span>{clientZip}</div>
                  )}
                  {clientNotes && (
                    <div className="flex items-center"><FileText className="mr-2 h-4 w-4" />{clientNotes}</div>
                  )}
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center"><Calendar className="mr-2 h-4 w-4" /><span className="text-muted-foreground">Created:</span><span className="ml-2">{createdIso ? new Date(createdIso).toLocaleDateString() : "—"}</span></div>
                <div className="flex items-center"><Calendar className="mr-2 h-4 w-4" /><span className="text-muted-foreground">Valid Until:</span><span className="ml-2">{q.validUntil ? new Date(q.validUntil).toLocaleDateString() : "—"}</span></div>
              </div>
            </CardContent>
          </Card>

          {/* Products – area-based UI */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {areas && areas.length > 0 ? (
                <div className="space-y-6">
                  {areas.map((area, aIdx) => (
                    <div key={area.areaRoomTypeId || aIdx} className="border rounded-md p-3">
                      <div className="font-semibold mb-2">Area: {area.areaRoomTypeName || area.areaRoomTypeId || "—"}</div>
                      {area.items && area.items.length > 0 ? (
                        <div className="space-y-2">
                          {area.items.map((item, idx) => (
                            <div key={item.id || item._id || idx} className="flex items-center justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium">{item.productName}</h5>
                                <p className="text-sm text-muted-foreground">
                                  {Number(item.quantity)} × Rs {Number(item.unitPrice).toFixed(2)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">Rs {Number(item.total ?? (item.quantity * item.unitPrice)).toFixed(2)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-sm">No products for this area.</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : items && items.length > 0 ? (
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={item.id || item._id || idx}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium">{item.productName}</h5>
                          <p className="text-sm text-muted-foreground">
                            {Number(item.quantity)} × Rs {Number(item.unitPrice).toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">Rs {Number(item.total ?? (item.quantity * item.unitPrice)).toFixed(2)}</p>
                        </div>
                      </div>
                      {idx < items.length - 1 && <Separator className="mt-3" />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  No products found.<br />
                  <pre style={{ fontSize: 12, color: '#888', background: '#f7f7f7', padding: 8, borderRadius: 4, marginTop: 8 }}>{JSON.stringify({ areas, items }, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary – unchanged UI */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between"><span>Subtotal:</span><span>Rs {subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Tax:</span><span>Rs {tax.toFixed(2)}</span></div>
                {Number(q.discount || 0) > 0 && (
                  <div className="flex justify-between"><span>Discount:</span><span>- Rs {Number(q.discount).toFixed(2)}</span></div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-lg"><span>Total:</span><span>Rs {total.toFixed(2)}</span></div>
              </div>
            </CardContent>
          </Card>

          {/* Notes – unchanged UI */}
          {!!q.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-serif flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line">{q.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Template selection dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Quotation Template</label>
            <Select value={selectedTemplateId ?? ""} onValueChange={setSelectedTemplateId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {templates.map((tpl) => (
                    <SelectItem key={tpl._id} value={String(tpl._id)}>
                      {tpl.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          {/* Export/Print button: pass selectedTemplateId to print page */}
          <Button
            variant="default"
            onClick={() => {
              const exportId = q._id || q.id
              window.location.assign(`/quotations/${exportId}/print?templateId=${selectedTemplateId ?? ""}`)
            }}
          >
            Export / Print
          </Button>
          <Button className="bg-white text-[oklch(0%_0_0)] hover:bg-[oklch(0.577_0.245_27.325)]/80 " onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
