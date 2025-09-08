

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface Dealer {
  id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  status: "Active" | "Inactive"
  registrationDate: string
  dealerType: "Authorized" | "Premium" | "Standard"
  territory: string
  logo?: string
  logoUrl?: string
}

interface DeleteDealerDialogProps {
  dealer: Dealer | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteDealerDialog({ dealer, open, onOpenChange, onConfirm }: DeleteDealerDialogProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!dealer) return null

  const handleDelete = async () => {
    if (isDeleting) return
    setIsDeleting(true)
    setError(null)

    try {
      const res = await fetch(`/api/dealers/${dealer.id}`, { method: "DELETE" })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Delete failed" }))
        throw new Error(error || "Delete failed")
      }
      // notify parent (e.g., remove from local list)
      onConfirm()
      // close and refresh server data
      onOpenChange(false)
      router.refresh()
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong while deleting")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <DialogTitle className="font-serif">Delete Dealer</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete <strong>{dealer.name}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 p-3 rounded-md space-y-1">
          <p className="text-sm"><strong>Contact:</strong> {dealer.contactPerson}</p>
          <p className="text-sm"><strong>Territory:</strong> {dealer.territory}</p>
          <p className="text-sm"><strong>Type:</strong> {dealer.dealerType}</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete Dealer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
