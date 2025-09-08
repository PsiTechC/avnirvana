
"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, Trash2, FileText, Calendar, Package } from "lucide-react"

/** Keep this type permissive to match DB/API variations */
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
  dealerId?: string
  dealerName?: string
  contactPerson?: string
  email?: string
  phone?: string
  status: "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired"
  createdDate?: string
  createdAt?: string
  validUntil: string
  items: QuotationItem[]
  areas?: any[]
  subtotal?: number
  tax?: number
  discount?: number
  total?: number
  notes?: string
  // Some list APIs may return nested dealer
  dealer?: {
    _id?: string
    id?: string
    name?: string
    contactPerson?: string
    email?: string
    phone?: string
  }
}

type Props = {
  quotation: Quotation
  onEdit?: (q: Quotation) => void
  onDelete?: (q: Quotation) => void
  onView?: (q: Quotation) => void
}

function statusBadgeClass(status: Quotation["status"]) {
  switch (status) {
    case "Draft":
      return "bg-gray-100 text-gray-800"
    case "Sent":
      return "bg-blue-100 text-blue-800"
    case "Accepted":
      return "bg-green-100 text-green-800"
    case "Rejected":
      return "bg-red-100 text-red-800"
    case "Expired":
      return "bg-orange-100 text-orange-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

function isExpired(iso?: string) {
  if (!iso) return false
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return false
  return d < new Date()
}

export default function QuotationCard({ quotation, onEdit, onDelete, onView }: Props) {
  // Prefer flattened fields; if absent but a nested dealer exists, show from it
  const dealerName = quotation.dealerName ?? quotation.dealer?.name ?? "—"
  const contact = quotation.contactPerson ?? quotation.dealer?.contactPerson
  const email = quotation.email ?? quotation.dealer?.email

  const created = quotation.createdAt ?? quotation.createdDate
  const createdStr = created ? new Date(created).toLocaleDateString() : "—"

  const expired = isExpired(quotation.validUntil)
  const effectiveStatus =
    expired && !["Accepted", "Rejected"].includes(quotation.status) ? "Expired" : quotation.status

  // Support area-based quotations for total units
  let itemCount = 0;
  let totalUnits = 0;
  if (Array.isArray(quotation.areas) && quotation.areas.length > 0) {
    itemCount = quotation.areas.reduce((count: number, area: any) => count + (area.items?.length ?? 0), 0);
    totalUnits = quotation.areas.reduce(
      (sum: number, area: any) => sum + (Array.isArray(area.items)
        ? area.items.reduce((s: number, it: any) => s + (Number(it.quantity) || 0), 0)
        : 0),
      0
    );
  } else {
    itemCount = quotation?.items?.length ?? 0;
    totalUnits = (quotation?.items ?? []).reduce((sum: number, it: any) => sum + (Number(it.quantity) || 0), 0);
  }

  const idForKey = quotation._id ?? quotation.id ?? quotation.quotationNumber

  return (
    <Card key={idForKey} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className=" font-bold text-black text-lg">#{quotation.quotationNumber}</h3>
            <p className="text-sm text-muted-foreground">{dealerName}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label="Actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(quotation)}>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </DropdownMenuItem>
              {/* <DropdownMenuItem onClick={() => onEdit?.(quotation)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem> */}
              <DropdownMenuItem onClick={() => onDelete?.(quotation)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status & totals row */}
        <div className="flex items-center justify-between">
          <Badge className={statusBadgeClass(effectiveStatus)}>{effectiveStatus}</Badge>
          <div className="text-right">
            <p className="text-lg font-semibold">Rs {Number(quotation.total || 0).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{itemCount} items</p>
          </div>
        </div>

        {/* Meta list */}
        <div className="space-y-2">
          {(contact || email) && (
            <div className="flex items-center space-x-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>
                {contact || "—"}
                {email ? ` • ${email}` : ""}
              </span>
            </div>
          )}
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Valid until {quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : "—"}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span>{totalUnits} total units</span>
          </div>
        </div>

        {/* Created */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">Created: {createdStr}</p>
        </div>
      </CardContent>
    </Card>
  )
}
