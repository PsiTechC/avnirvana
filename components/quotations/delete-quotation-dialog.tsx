// "use client"

// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { AlertTriangle } from "lucide-react"

// interface QuotationItem {
//   id: string
//   productId: string
//   productName: string
//   quantity: number
//   unitPrice: number
//   total: number
// }

// interface Quotation {
//   id: string
//   quotationNumber: string
//   dealerName: string
//   dealerId: string
//   contactPerson: string
//   email: string
//   phone: string
//   status: "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired"
//   createdDate: string
//   validUntil: string
//   items: QuotationItem[]
//   subtotal: number
//   tax: number
//   total: number
//   notes?: string
// }

// interface DeleteQuotationDialogProps {
//   quotation: Quotation | null
//   open: boolean
//   onOpenChange: (open: boolean) => void
//   onConfirm: () => void
// }

// export function DeleteQuotationDialog({ quotation, open, onOpenChange, onConfirm }: DeleteQuotationDialogProps) {
//   if (!quotation) return null

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[400px]">
//         <DialogHeader>
//           <div className="flex items-center space-x-2">
//             <AlertTriangle className="h-5 w-5 text-red-500" />
//             <DialogTitle className="font-serif">Delete Quotation</DialogTitle>
//           </div>
//           <DialogDescription>
//             Are you sure you want to delete quotation <strong>{quotation.quotationNumber}</strong>? This action cannot
//             be undone.
//           </DialogDescription>
//         </DialogHeader>

//         <div className="bg-muted/50 p-3 rounded-md">
//           <p className="text-sm">
//             <strong>Dealer:</strong> {quotation.dealerName}
//           </p>
//           <p className="text-sm">
//             <strong>Total:</strong> ${quotation.total.toFixed(2)}
//           </p>
//           <p className="text-sm">
//             <strong>Status:</strong> {quotation.status}
//           </p>
//         </div>

//         <div className="flex justify-end space-x-2">
//           <Button variant="outline" onClick={() => onOpenChange(false)}>
//             Cancel
//           </Button>
//           <Button variant="destructive" onClick={onConfirm}>
//             Delete Quotation
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   )
// }

// "use client"

// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { AlertTriangle } from "lucide-react"
// import type { Quotation } from "@/components/quotations/quotation-card"

// interface DeleteQuotationDialogProps {
//   quotation: Quotation | null
//   open: boolean
//   onOpenChange: (open: boolean) => void
//   onConfirm: () => void | Promise<void>
//   /** Optional UI state passed from the page */
//   loading?: boolean
//   error?: string | null
// }

// export function DeleteQuotationDialog({ quotation, open, onOpenChange, onConfirm, loading, error }: DeleteQuotationDialogProps) {
//   if (!quotation) return null

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[420px]">
//         <DialogHeader>
//           <div className="flex items-center space-x-2">
//             <AlertTriangle className="h-5 w-5 text-red-500" />
//             <DialogTitle className="font-serif">Delete Quotation</DialogTitle>
//           </div>
//           <DialogDescription>
//             Are you sure you want to delete quotation <strong>{quotation.quotationNumber}</strong>? This action cannot be undone.
//           </DialogDescription>
//         </DialogHeader>

//         <div className="bg-muted/50 p-3 rounded-md space-y-1 text-sm">
//           {quotation.dealerName && (
//             <p><strong>Dealer:</strong> {quotation.dealerName}</p>
//           )}
//           {typeof quotation.total !== "undefined" && (
//             <p><strong>Total:</strong> Rs {Number(quotation.total || 0).toFixed(2)}</p>
//           )}
//           <p><strong>Status:</strong> {quotation.status}</p>
//           {error && <p className="text-red-600 pt-1">{error}</p>}
//         </div>

//         <div className="flex justify-end gap-2">
//           <Button variant="outline" onClick={() => onOpenChange(false)} disabled={!!loading}>Cancel</Button>
//           <Button variant="destructive" onClick={() => onConfirm()} disabled={!!loading}>
//             {loading ? "Deleting…" : "Delete Quotation"}
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   )
// }

// export default DeleteQuotationDialog




"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

// Accept both id and _id shapes via a permissive type
export type Quotation = {
  id?: string
  _id?: string
  quotationNumber: string
  dealerName?: string
  status: "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired"
  total?: number
}

interface DeleteQuotationDialogProps {
  quotation: Quotation | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a successful deletion so the parent can refresh */
  onDeleted?: () => void
}

export default function DeleteQuotationDialog({ quotation, open, onOpenChange, onDeleted }: DeleteQuotationDialogProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!quotation) return null

  const handleDelete = async () => {
    if (busy) return
    const id = (quotation as any)._id ?? quotation.id
    if (!id) { setError("Missing quotation id"); return }
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/quotations/${id}`, { method: "DELETE" })
      if (!res.ok) {
        let msg = "Failed to delete quotation"
        try { const j = await res.json(); if (j?.error) msg = j.error } catch { }
        throw new Error(msg)
      }
      onOpenChange(false)
      onDeleted?.()
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete quotation")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o) }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <DialogTitle className="font-serif">Delete Quotation</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete quotation <strong>{quotation.quotationNumber}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 p-3 rounded-md space-y-1 text-sm">
          {quotation.dealerName && (
            <p><strong>Dealer:</strong> {quotation.dealerName}</p>
          )}
          {typeof quotation.total !== "undefined" && (
            <p><strong>Total:</strong> Rs {Number(quotation.total || 0).toFixed(2)}</p>
          )}
          <p><strong>Status:</strong> {quotation.status}</p>
          {error && <p className="text-red-600 pt-1">{error}</p>}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={busy}>
            {busy ? "Deleting…" : "Delete Quotation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
