// "use client"

// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { AlertTriangle } from "lucide-react"

// interface Brand {
//   id: string
//   name: string
//   description: string
//   logoUrl: string
//   websiteUrl: string
//   status: "active" | "inactive"
//   productsCount: number
//   createdAt: string
// }

// interface DeleteBrandDialogProps {
//   brand: Brand | null
//   open: boolean
//   onOpenChange: (open: boolean) => void
//   onConfirm: () => void
// }

// export function DeleteBrandDialog({ brand, open, onOpenChange, onConfirm }: DeleteBrandDialogProps) {
//   if (!brand) return null

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[400px]">
//         <DialogHeader>
//           <div className="flex items-center space-x-2">
//             <AlertTriangle className="h-5 w-5 text-destructive" />
//             <DialogTitle className="font-serif">Delete Brand</DialogTitle>
//           </div>
//           <DialogDescription>
//             Are you sure you want to delete <strong>{brand.name}</strong>? This action cannot be undone.
//             {brand.productsCount > 0 && (
//               <span className="block mt-2 text-destructive">
//                 Warning: This brand has {brand.productsCount} associated products.
//               </span>
//             )}
//           </DialogDescription>
//         </DialogHeader>
//         <div className="flex justify-end space-x-2 pt-4">
//           <Button variant="outline" onClick={() => onOpenChange(false)}>
//             Cancel
//           </Button>
//           <Button variant="destructive" onClick={onConfirm}>
//             Delete Brand
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   )
// }


"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import type { BrandUI } from "./types"

interface DeleteBrandDialogProps {
  brand: BrandUI | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteBrandDialog({ brand, open, onOpenChange, onConfirm }: DeleteBrandDialogProps) {
  if (!brand) return null

  const products = typeof brand.productsCount === "number" ? brand.productsCount : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle className="font-serif">Delete Brand</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete <strong>{brand.name}</strong>? This action cannot be undone.
            {products > 0 && (
              <span className="block mt-2 text-destructive">
                Warning: This brand has {products} associated products.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete Brand
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
