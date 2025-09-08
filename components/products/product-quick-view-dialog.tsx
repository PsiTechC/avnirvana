
// "use client"

// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import Image from "next/image"

// interface ProductQuickViewDialogProps {
//   open: boolean
//   onOpenChange: (open: boolean) => void
//   product: {
//     id: string
//     name: string
//     description?: string | null
//     specification?: string | null
//     brand?: string | null
//     categories?: string[] | null
//     functions?: string[] | null
//     price?: number
//     isPOR: boolean
//     imageUrl?: string | null
//     sku: string
//     status: "active" | "inactive"
//     stockLevel: number
//     createdAt?: string
//   } | null
//   onEdit: () => void
//   onDelete: () => void
// }

// export function ProductQuickViewDialog({
//   open,
//   onOpenChange,
//   product,
//   onEdit,
//   onDelete,
// }: ProductQuickViewDialogProps) {
//   if (!product) return null

//   const statusColor =
//     product.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"

//   const money = (product.isPOR ? "POR" : `₹ ${(product.price ?? 0).toFixed(2)}`)

//   const safeText = (v?: string | string[] | null) => {
//     if (Array.isArray(v)) {
//       return v.length ? v.join(", ") : "—"
//     }
//     if (typeof v === "string") {
//       return v.trim() ? v : "—"
//     }
//     return "—"
//   }

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="font-serif">{product.name}</DialogTitle>
//         </DialogHeader>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           <div className="md:col-span-1">
//             {product.imageUrl ? (
//               <div className="relative w-full aspect-square rounded-lg overflow-hidden border">
//                 <Image
//                   src={product.imageUrl}
//                   alt={product.name}
//                   fill
//                   sizes="320px"
//                   className="object-cover"
//                 />
//               </div>
//             ) : (
//               <div className="w-full aspect-square rounded-lg bg-muted" />
//             )}
//           </div>

//           {/* Right column */}
//           <div className="md:col-span-2 space-y-4">
//             <div className="flex items-center gap-2">
//               <Badge className={statusColor}>{product.status}</Badge>
//               <span className="text-sm text-muted-foreground">SKU: {safeText(product.sku)}</span>
//             </div>

//             <div className="grid grid-cols-2 gap-3 text-sm">
//               <div>
//                 <div className="text-muted-foreground">Brand</div>
//                 <div className="font-medium">{safeText(product.brand)}</div>
//               </div>
//               <div>
//                 <div className="text-muted-foreground">Categories</div>
//                 <div className="font-medium">{safeText(product.categories)}</div>
//               </div>
//               <div>
//                 <div className="text-muted-foreground">Functions</div>
//                 <div className="font-medium">{safeText(product.functions)}</div>
//               </div>
//               <div>
//                 <div className="text-muted-foreground">Stock</div>
//                 <div className="font-medium">{product.stockLevel ?? 0}</div>
//               </div>
//               <div>
//                 <div className="text-muted-foreground">Price</div>
//                 <div className="font-medium">{money}</div>
//               </div>
//               <div>
//                 <div className="text-muted-foreground">Created</div>
//                 <div className="font-medium">
//                   {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "—"}
//                 </div>
//               </div>
//             </div>

//             {/* Description (scrollable) */}
//             <div>
//               <div className="text-sm text-muted-foreground mb-1">Description</div>
//               <div className="max-h-[40vh] overflow-y-auto rounded-md border p-2 bg-muted/30">
//                 <p className="text-sm leading-6 whitespace-pre-wrap break-words">
//                   {safeText(product.description)}
//                 </p>
//               </div>
//             </div>

//             {/* Specification (scrollable) */}
//             <div>
//               <div className="text-sm text-muted-foreground mb-1">Specification</div>
//               <div className="max-h-[40vh] overflow-y-auto rounded-md border p-2 bg-muted/30">
//                 <p className="text-sm leading-6 whitespace-pre-wrap break-words">
//                   {safeText(product.specification)}
//                 </p>
//               </div>
//             </div>

//             <div className="flex justify-end gap-2 pt-2">
//               <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
//               <Button onClick={() => { onOpenChange(false); onEdit() }}>Edit</Button>
//               <Button
//                 variant="destructive"
//                 onClick={() => { onOpenChange(false); onDelete() }}
//               >
//                 Delete
//               </Button>
//             </div>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   )
// }

