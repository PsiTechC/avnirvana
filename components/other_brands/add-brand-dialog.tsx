// "use client"

// import type React from "react"

// import { useState } from "react"
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// interface AddBrandDialogProps {
//   open: boolean
//   onOpenChange: (open: boolean) => void
// }

// export function AddBrandDialog({ open, onOpenChange }: AddBrandDialogProps) {
//   const [formData, setFormData] = useState({
//     name: "",
//     description: "",
//     websiteUrl: "",
//     status: "active" as "active" | "inactive",
//   })

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()
//     // Here you would typically save the brand to your backend
//     console.log("Adding brand:", formData)
//     onOpenChange(false)
//     setFormData({
//       name: "",
//       description: "",
//       websiteUrl: "",
//       status: "active",
//     })
//   }

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[500px]">
//         <DialogHeader>
//           <DialogTitle className="font-serif">Add New Brand</DialogTitle>
//         </DialogHeader>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="space-y-2">
//             <Label htmlFor="name">Brand Name</Label>
//             <Input
//               id="name"
//               value={formData.name}
//               onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//               placeholder="Enter brand name"
//               required
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="description">Description</Label>
//             <Textarea
//               id="description"
//               value={formData.description}
//               onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//               placeholder="Enter brand description"
//               rows={3}
//               required
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="website">Website URL</Label>
//             <Input
//               id="website"
//               type="url"
//               value={formData.websiteUrl}
//               onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
//               placeholder="https://example.com"
//               required
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="status">Status</Label>
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
//               Add Brand
//             </Button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   )
// }


// "use client"

// import type React from "react"
// import { useState } from "react"
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// interface AddBrandDialogProps {
//   open: boolean
//   onOpenChange: (open: boolean) => void
//   // Optional: let parent refresh a list/grid after create
//   onCreated?: () => void
// }

// export function AddBrandDialog({ open, onOpenChange, onCreated }: AddBrandDialogProps) {
//   const [formData, setFormData] = useState({
//     name: "",
//     description: "",
//     websiteUrl: "",
//     status: "active" as "active" | "inactive",
//   })
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [error, setError] = useState<string | null>(null)

//   const resetForm = () =>
//     setFormData({
//       name: "",
//       description: "",
//       websiteUrl: "",
//       status: "active",
//     })

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (isSubmitting) return
//     setIsSubmitting(true)
//     setError(null)

//     // (optional) quick URL sanity check; server also validates
//     if (formData.websiteUrl) {
//       try {
//         const u = new URL(formData.websiteUrl)
//         if (!/^https?:$/.test(u.protocol)) throw new Error("Invalid protocol")
//       } catch {
//         setIsSubmitting(false)
//         setError("Please enter a valid URL starting with http:// or https://")
//         return
//       }
//     }

//     try {
//       // Map fields → API body expected by /api/other-brands
//       const body = {
//         name: formData.name,
//         description: formData.description || undefined,
//         websiteUrl: formData.websiteUrl || undefined,
//         status: formData.status as "active" | "inactive",
//       }

//       const res = await fetch("/api/other-brands", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(body),
//       })

//       if (!res.ok) {
//         const maybe = await res.json().catch(() => null)
//         throw new Error(maybe?.error || "Failed to create brand")
//       }

//       // Close, reset, and notify parent to refresh if needed
//       onOpenChange(false)
//       resetForm()
//       onCreated?.()
//     } catch (err: any) {
//       setError(err?.message ?? "Something went wrong")
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[500px]">
//         <DialogHeader>
//           <DialogTitle className="font-serif">Add New Brand</DialogTitle>
//         </DialogHeader>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="space-y-2">
//             <Label htmlFor="name">Brand Name</Label>
//             <Input
//               id="name"
//               value={formData.name}
//               onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//               placeholder="Enter brand name"
//               required
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="description">Description</Label>
//             <Textarea
//               id="description"
//               value={formData.description}
//               onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//               placeholder="Enter brand description"
//               rows={3}
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="websiteUrl">Website URL</Label>
//             <Input
//               id="websiteUrl"
//               type="url"
//               value={formData.websiteUrl}
//               onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
//               placeholder="https://example.com"
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="status">Status</Label>
//             <Select
//               value={formData.status}
//               onValueChange={(value: "active" | "inactive") =>
//                 setFormData({ ...formData, status: value })
//               }
//             >
//               <SelectTrigger>
//                 <SelectValue placeholder="Select status" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="active">Active</SelectItem>
//                 <SelectItem value="inactive">Inactive</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           {error && <p className="text-sm text-red-500">{error}</p>}

//           <div className="flex justify-end space-x-2 pt-4">
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => onOpenChange(false)}
//               disabled={isSubmitting}
//             >
//               Cancel
//             </Button>
//             <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={isSubmitting}>
//               {isSubmitting ? "Adding…" : "Add Brand"}
//             </Button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   )
// }
