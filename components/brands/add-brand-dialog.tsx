


// "use client"

// import type React from "react"
// import { useState, useRef } from "react"
// import { useRouter } from "next/navigation"
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Upload, X } from "lucide-react"
// import Image from "next/image"

// type BrandStatus = "active" | "inactive"

// interface AddBrandDialogProps {
//   open: boolean
//   onOpenChange: (open: boolean) => void
//   onCreated?: () => void
// }

// export function AddBrandDialog({ open, onOpenChange, onCreated }: AddBrandDialogProps) {
//   const router = useRouter()
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [logoError, setLogoError] = useState<string | null>(null)
//   const fileInputRef = useRef<HTMLInputElement>(null)

//   const [formData, setFormData] = useState({
//     name: "",
//     description: "",
//     websiteUrl: "",
//     status: "active" as BrandStatus,
//     logo: null as File | null,
//     logoPreview: "",
//   })

//   const resetForm = () =>
//     setFormData({
//       name: "",
//       description: "",
//       websiteUrl: "",
//       status: "active",
//       logo: null,
//       logoPreview: "",
//     })

//   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     setLogoError(null)
//     if (!file) return

//     // Basic client-side validation: type & size
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

//     try {
//   // No frontend websiteUrl validation; backend allows any string

//       // --- Send to backend (multipart) ---
//       const fd = new FormData()
//       fd.append("name", formData.name)
//       fd.append("description", formData.description)
//       fd.append("websiteUrl", formData.websiteUrl)
//       fd.append("status", formData.status)
//       if (formData.logo) fd.append("logo", formData.logo)

//       const res = await fetch("/api/brands", { method: "POST", body: fd })
//       if (!res.ok) {
//         // Optional: read and show server error message
//         // const { error } = await res.json().catch(() => ({ error: "Create failed" }))
//         throw new Error("Create failed")
//       }

//       // Close first for snappy UX, then reset + refresh the grid
//       onCreated?.() 
//       onOpenChange(false)
//       setTimeout(() => {
//         resetForm()
//         setIsSubmitting(false)
//         //router.refresh()
//       }, 0)
//     } catch {
//       // Optional: show toast/error UI
//       setIsSubmitting(false)
//     }
//   }

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//   <DialogContent className="sm:max-w-[400px] max-w-full max-h-[90 vh] bg-gradient-to-br from-white/15 via-white/10 to-blue-500/20 backdrop-blur-lg border border-white/20 rounded-2xl">
//         <DialogHeader>
//           <DialogTitle className="font-serif text-white">Add New Brand</DialogTitle>
//         </DialogHeader>

//   <form onSubmit={handleSubmit} className="space-y-3">
//           {/* Name */}
//           <div className="space-y-1">
//             <Label htmlFor="name" className="text-white/90">
//               Brand Name
//             </Label>
//             <Input
//               id="name"
//               name="name"
//               value={formData.name}
//               onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//               placeholder="Enter brand name"
//               required
//               maxLength={120}
//               className="bg-white/20 border-white/30 text-white placeholder-white/60 backdrop-blur-sm rounded-lg text-sm py-1.5 px-2"
//             />
//           </div>

//           {/* Logo */}
//           <div className="space-y-1">
//             <Label className="text-white/90">Brand Logo</Label>
//             <div className="space-y-2">
//               {formData.logoPreview ? (
//                 <div className="relative">
//                   <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/30">
//                     <Image
//                       src={formData.logoPreview}
//                       alt="Brand logo preview"
//                       fill
//                       sizes="96px"
//                       className="object-cover"
//                     />
//                   </div>
//                   <Button
//                     type="button"
//                     variant="ghost"
//                     size="icon"
//                     className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 hover:bg-red-600 text-white"
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
//                   aria-label="Upload brand logo"
//                   onClick={() => fileInputRef.current?.click()}
//                   onKeyDown={(e) =>
//                     (e.key === "Enter" || e.key === " ") && fileInputRef.current?.click()
//                   }
//                   className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-white/30 rounded-lg cursor-pointer hover:border-white/50 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
//                 >
//                   <Upload className="h-6 w-6 text-white/60 mb-1" />
//                   <span className="text-xs text-white/60">Click to upload logo</span>
//                   <span className="text-[10px] text-white/40">PNG, JPG up to 2MB</span>
//                 </div>
//               )}
//               <Input
//                 ref={fileInputRef}
//                 type="file"
//                 accept="image/png,image/jpeg"
//                 onChange={handleFileSelect}
//                 className="hidden"
//               />
//               {logoError && <p className="text-[10px] text-red-300">{logoError}</p>}
//             </div>
//           </div>

//           {/* Description */}
//           <div className="space-y-1">
//             <Label htmlFor="description" className="text-white/90">
//               Description
//             </Label>
//               <div className="relative">
//                 <Textarea
//                   id="description"
//                   name="description"
//                   value={formData.description}
//                   onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                   placeholder="Enter brand description"
//                   rows={3}
//                   required
//                   maxLength={500}
//                   className="h-20 max-h-24 overflow-y-auto resize-none bg-white/20 border-white/30 text-white placeholder-white/60 backdrop-blur-sm rounded-lg scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100 text-sm py-1.5 px-2"
//                   style={{ minHeight: "5rem", maxHeight: "6rem", overflowY: "auto" }}
//                 />
//               </div>
//           </div>

//           {/* Website */}
//           <div className="space-y-1">
//             <Label htmlFor="website" className="text-white/90">
//               Website URL
//             </Label>
//             <Input
//               id="website"
//               name="websiteUrl"
//               type="url"
//               inputMode="url"
//               value={formData.websiteUrl}
//               onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
//               placeholder="https://example.com"
//               required
//               maxLength={2048}
//               className="bg-white/20 border-white/30 text-white placeholder-white/60 backdrop-blur-sm rounded-lg text-sm py-1.5 px-2"
//             />
//           </div>

//           {/* Status */}
//           <div className="space-y-1">
//             <Label id="status-label" className="text-white/90">
//               Status
//             </Label>
//             <Select
//               value={formData.status}
//               onValueChange={(value) => setFormData({ ...formData, status: value as BrandStatus })}
//             >
//               <SelectTrigger
//                 aria-labelledby="status-label"
//                 className="bg-white/20 border-white/30 text-white backdrop-blur-sm rounded-lg text-sm py-1.5 px-2"
//               >
//                 <SelectValue placeholder="Select status" />
//               </SelectTrigger>
//               <SelectContent className="bg-white/90 backdrop-blur-md border-white/20 rounded-lg text-sm">
//                 <SelectItem value="active" className="text-gray-900 hover:bg-white/20 text-sm">
//                   Active
//                 </SelectItem>
//                 <SelectItem value="inactive" className="text-gray-900 hover:bg-white/20 text-sm">
//                   Inactive
//                 </SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           {/* Actions */}
//           <div className="flex justify-end gap-2 pt-2">
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => onOpenChange(false)}
//               className="border-white/30 text-white hover:bg-white/20 backdrop-blur-sm rounded-lg text-sm px-3 py-1"
//             >
//               Cancel
//             </Button>
//             <Button
//               type="submit"
//               disabled={isSubmitting}
//               className="bg-blue-500 hover:bg-blue-600 text-white backdrop-blur-sm rounded-lg disabled:opacity-60 text-sm px-3 py-1"
//             >
//               {isSubmitting ? "Adding..." : "Add Brand"}
//             </Button>
//           </div>
//         </form>
//       </DialogContent>
//     </Dialog>
//   )
// }
