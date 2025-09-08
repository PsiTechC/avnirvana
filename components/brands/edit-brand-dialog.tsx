// "use client"

// import type React from "react"

// import { useState, useEffect } from "react"
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

// interface EditBrandDialogProps {
//   brand: Brand | null
//   open: boolean
//   onOpenChange: (open: boolean) => void
//   onSave: (brand: Brand) => void
// }

// export function EditBrandDialog({ brand, open, onOpenChange, onSave }: EditBrandDialogProps) {
//   const [formData, setFormData] = useState({
//     name: "",
//     description: "",
//     websiteUrl: "",
//     status: "active" as "active" | "inactive",
//   })

//   useEffect(() => {
//     if (brand) {
//       setFormData({
//         name: brand.name,
//         description: brand.description,
//         websiteUrl: brand.websiteUrl,
//         status: brand.status,
//       })
//     }
//   }, [brand])

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()
//     if (brand) {
//       onSave({
//         ...brand,
//         ...formData,
//       })
//     }
//   }

//   if (!brand) return null

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[500px]">
//         <DialogHeader>
//           <DialogTitle className="font-serif">Edit Brand</DialogTitle>
//         </DialogHeader>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="space-y-2">
//             <Label htmlFor="edit-name">Brand Name</Label>
//             <Input
//               id="edit-name"
//               value={formData.name}
//               onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//               placeholder="Enter brand name"
//               required
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="edit-description">Description</Label>
//             <Textarea
//               id="edit-description"
//               value={formData.description}
//               onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//               placeholder="Enter brand description"
//               rows={3}
//               required
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="edit-website">Website URL</Label>
//             <Input
//               id="edit-website"
//               type="url"
//               value={formData.websiteUrl}
//               onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
//               placeholder="https://example.com"
//               required
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="edit-status">Status</Label>
//             <Select
//               value={formData.status}
//               onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
//             >
//               <SelectTrigger>
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="active">Active</SelectItem>
//                 <SelectItem value="inactive">Inactive</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="flex justify-end space-x-2 pt-4">
//             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
//               Cancel
//             </Button>
//             <Button type="submit" className="bg-accent hover:bg-accent/90">
//               Save Changes
//             </Button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   )
// }


// "use client"

// import type React from "react"
// import { useState, useEffect } from "react"
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import type { BrandUI } from "./types"

// interface EditBrandDialogProps {
//   brand: BrandUI | null
//   open: boolean
//   onOpenChange: (open: boolean) => void
//   onSave: (brand: BrandUI) => void
// }

// export function EditBrandDialog({ brand, open, onOpenChange, onSave }: EditBrandDialogProps) {
//   const [formData, setFormData] = useState({
//     name: "",
//     description: "",
//     websiteUrl: "",
//     status: "active" as "active" | "inactive",
//   })

//   useEffect(() => {
//     if (brand) {
//       setFormData({
//         name: brand.name,
//         description: brand.description ?? "",
//         websiteUrl: brand.websiteUrl ?? "",
//         status: brand.status,
//       })
//     }
//   }, [brand])

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()
//     if (brand) {
//       onSave({
//         ...brand,
//         ...formData,
//       })
//     }
//   }

//   if (!brand) return null

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[500px]">
//         <DialogHeader>
//           <DialogTitle className="font-serif">Edit Brand</DialogTitle>
//         </DialogHeader>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="space-y-2">
//             <Label htmlFor="edit-name">Brand Name</Label>
//             <Input
//               id="edit-name"
//               value={formData.name}
//               onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//               placeholder="Enter brand name"
//               required
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="edit-description">Description</Label>
//             <Textarea
//               id="edit-description"
//               value={formData.description}
//               onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//               placeholder="Enter brand description"
//               rows={6}
//               className="h-32 max-h-56 overflow-y-auto resize-none"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="edit-website">Website URL</Label>
//             <Input
//               id="edit-website"
//               type="url"
//               value={formData.websiteUrl}
//               onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
//               placeholder="https://example.com"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="edit-status">Status</Label>
//             <Select
//               value={formData.status}
//               onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
//             >
//               <SelectTrigger>
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="active">Active</SelectItem>
//                 <SelectItem value="inactive">Inactive</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="flex justify-end space-x-2 pt-4">
//             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
//               Cancel
//             </Button>
//             <Button type="submit" className="bg-accent hover:bg-accent/90">
//               Save Changes
//             </Button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   )
// }
