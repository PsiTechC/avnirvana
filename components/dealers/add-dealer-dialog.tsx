
// "use client"

// import type React from "react"
// import { useState, useRef } from "react"
// import { useRouter } from "next/navigation"
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Textarea } from "@/components/ui/textarea"
// import { Upload, X } from "lucide-react"
// import Image from "next/image"

// interface AddDealerDialogProps {
//   open: boolean
//   onOpenChange: (open: boolean) => void
// }

// export function AddDealerDialog({ open, onOpenChange }: AddDealerDialogProps) {
//   const router = useRouter()
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [logoError, setLogoError] = useState<string | null>(null)
//   const fileInputRef = useRef<HTMLInputElement>(null)

//   const [formData, setFormData] = useState({
//     name: "",
//     contactPerson: "",
//     email: "",
//     phone: "",
//     address: "",
//     city: "",
//     state: "",
//     zipCode: "",
//     status: "Active",
//     dealerType: "Standard",
//     territory: "",
//     // NEW:
//     logo: null as File | null,
//     logoPreview: "",
//   })

//   const handleChange = (field: string, value: string) => {
//     setFormData((prev) => ({ ...prev, [field]: value }))
//   }

//   const resetForm = () =>
//     setFormData({
//       name: "",
//       contactPerson: "",
//       email: "",
//       phone: "",
//       address: "",
//       city: "",
//       state: "",
//       zipCode: "",
//       status: "Active",
//       dealerType: "Standard",
//       territory: "",
//       logo: null,
//       logoPreview: "",
//     })

//   // --- Logo upload handlers (PNG/JPG up to 2MB) ---
//   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     setLogoError(null)
//     if (!file) return

//     const validTypes = ["image/png", "image/jpeg"]
//     if (!validTypes.includes(file.type)) {
//       setLogoError("Please upload a PNG or JPG image.")
//       if (fileInputRef.current) fileInputRef.current.value = ""
//       return
//     }
//     const MAX_BYTES = 2 * 1024 * 1024 // 2MB
//     if (file.size > MAX_BYTES) {
//       setLogoError("File is too large. Max size is 2MB.")
//       if (fileInputRef.current) fileInputRef.current.value = ""
//       return
//     }

//     const reader = new FileReader()
//     reader.onloadend = () => {
//       setFormData((prev) => ({
//         ...prev,
//         logo: file,
//         logoPreview: reader.result as string,
//       }))
//     }
//     reader.readAsDataURL(file)
//   }

//   const removeLogo = () => {
//     setLogoError(null)
//     setFormData((prev) => ({ ...prev, logo: null, logoPreview: "" }))
//     if (fileInputRef.current) fileInputRef.current.value = ""
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (isSubmitting) return
//     setIsSubmitting(true)
//     setLogoError(null)

//     try {
//       // Build multipart form data (logo optional)
//       const fd = new FormData()
//       fd.append("name", formData.name.trim())
//       fd.append("contactPerson", formData.contactPerson.trim())
//       fd.append("email", formData.email.trim())
//       fd.append("phone", formData.phone.trim())
//       fd.append("address", formData.address.trim())
//       fd.append("city", formData.city.trim())
//       fd.append("state", formData.state.trim())
//       fd.append("zipCode", formData.zipCode.trim())
//       fd.append("status", formData.status) // "Active" | "Inactive"
//       fd.append("dealerType", formData.dealerType) // "Authorized" | "Premium" | "Standard"
//       fd.append("territory", formData.territory)
//       if (formData.logo) fd.append("logo", formData.logo)

//       const res = await fetch("/api/dealers", { method: "POST", body: fd })
//       if (!res.ok) {
//         const { error } = await res.json().catch(() => ({ error: "Create failed" }))
//         throw new Error(error || "Create failed")
//       }

//       onOpenChange(false)
//       resetForm()
//       router.refresh()
//     } catch (err) {
//       // (Optional) surface toast here
//       console.error(err)
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="font-serif">Add New Dealer</DialogTitle>
//         </DialogHeader>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           {/* Logo (optional) */}
//           <div className="space-y-2">
//             <Label>Dealer Logo (optional)</Label>
//             <div className="space-y-2">
//               {formData.logoPreview ? (
//                 <div className="relative">
//                   <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
//                     <Image
//                       src={formData.logoPreview}
//                       alt="Dealer logo preview"
//                       fill
//                       sizes="96px"
//                       className="object-cover"
//                     />
//                   </div>
//                   <Button
//                     type="button"
//                     variant="ghost"
//                     size="icon"
//                     className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white"
//                     onClick={removeLogo}
//                     aria-label="Remove logo"
//                   >
//                     <X className="h-3 w-3" />
//                   </Button>
//                 </div>
//               ) : (
//                 <div
//                   role="button"
//                   tabIndex={0}
//                   aria-label="Upload dealer logo"
//                   onClick={() => fileInputRef.current?.click()}
//                   onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInputRef.current?.click()}
//                   className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors focus:outline-none focus:ring-2"
//                 >
//                   <Upload className="h-8 w-8 mb-2" />
//                   <span className="text-sm">Click to upload logo</span>
//                   <span className="text-xs text-muted-foreground">PNG, JPG up to 2MB</span>
//                 </div>
//               )}
//               <Input
//                 ref={fileInputRef}
//                 type="file"
//                 accept="image/png,image/jpeg"
//                 onChange={handleFileSelect}
//                 className="hidden"
//               />
//               {logoError && <p className="text-xs text-red-500">{logoError}</p>}
//             </div>
//           </div>

//           {/* Basic info */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label htmlFor="name">Dealer Name *</Label>
//               <Input id="name" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} required />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="contactPerson">Contact Person *</Label>
//               <Input
//                 id="contactPerson"
//                 value={formData.contactPerson}
//                 onChange={(e) => handleChange("contactPerson", e.target.value)}
//                 required
//               />
//             </div>
//           </div>

//           {/* Contact */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label htmlFor="email">Email *</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 value={formData.email}
//                 onChange={(e) => handleChange("email", e.target.value)}
//                 required
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="phone">Phone *</Label>
//               <Input
//                 id="phone"
//                 value={formData.phone}
//                 onChange={(e) => handleChange("phone", e.target.value)}
//                 required
//               />
//             </div>
//           </div>

//           {/* Address */}
//           <div className="space-y-2">
//             <Label htmlFor="address">Address *</Label>
//             <Textarea id="address" value={formData.address} onChange={(e) => handleChange("address", e.target.value)} required />
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="space-y-2">
//               <Label htmlFor="city">City *</Label>
//               <Input id="city" value={formData.city} onChange={(e) => handleChange("city", e.target.value)} required />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="state">State *</Label>
//               <Input id="state" value={formData.state} onChange={(e) => handleChange("state", e.target.value)} required />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="zipCode">Zip Code *</Label>
//               <Input id="zipCode" value={formData.zipCode} onChange={(e) => handleChange("zipCode", e.target.value)} required />
//             </div>
//           </div>

//           {/* Meta */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="space-y-2">
//               <Label htmlFor="status">Status</Label>
//               <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="Active">Active</SelectItem>
//                   <SelectItem value="Inactive">Inactive</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="dealerType">Dealer Type</Label>
//               <Select value={formData.dealerType} onValueChange={(value) => handleChange("dealerType", value)}>
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="Premium">Premium</SelectItem>
//                   <SelectItem value="Authorized">Authorized</SelectItem>
//                   <SelectItem value="Standard">Standard</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="territory">Territory *</Label>
//               <Select value={formData.territory} onValueChange={(value) => handleChange("territory", value)}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select territory" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="Northeast">Northeast</SelectItem>
//                   <SelectItem value="Southeast">Southeast</SelectItem>
//                   <SelectItem value="Midwest">Midwest</SelectItem>
//                   <SelectItem value="Southwest">Southwest</SelectItem>
//                   <SelectItem value="West Coast">West Coast</SelectItem>
//                   <SelectItem value="Northwest">Northwest</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>

//           <div className="flex justify-end space-x-2 pt-4">
//             <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
//               Cancel
//             </Button>
//             <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={isSubmitting}>
//               {isSubmitting ? "Adding..." : "Add Dealer"}
//             </Button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   )
// }
