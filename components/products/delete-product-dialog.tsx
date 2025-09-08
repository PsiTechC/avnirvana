"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface Product {
  id: string
  name: string
  description: string
  brand: string
  category: string
  categoryIds?: string[]
  function: string
  functionIds?: string[]
  price: number
  isPOR: boolean
  imageUrl: string
  //sku: string
  status: "active" | "inactive"
  //stockLevel: number
  createdAt: string
}

interface DeleteProductDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteProductDialog({ product, open, onOpenChange, onConfirm }: DeleteProductDialogProps) {
  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle className="font-serif">Delete Product</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete <strong>{product.name}</strong> ? This action cannot be
            undone.
            {/* {product.stockLevel > 0 && (
              <span className="block mt-2 text-destructive">
                Warning: This product has {product.stockLevel} units in stock.
              </span>
            )} */}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete Product
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
