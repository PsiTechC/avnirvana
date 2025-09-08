
"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import { Upload, X } from "lucide-react"

interface AddProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

type Option = { id: string; name: string }

export function AddProductDialog({ open, onOpenChange, onCreated }: AddProductDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    specification: "",
    brandId: "",
    categoryIds: [] as string[],
    functionIds: [] as string[],
    price: "",
    isPOR: false,
    gstPercent: "",
    isNewProduct: false,
    status: "active" as "active" | "inactive",
  })

  // images state
  const fileRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [mainImageIndex, setMainImageIndex] = useState<number | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  // options
  const [brands, setBrands] = useState<Option[]>([])
  const [categories, setCategories] = useState<Option[]>([])
  const [functions, setFunctions] = useState<Option[]>([])

  // Helper to get name by id
  const nameById = (id: string, list: Option[]) => list.find((x) => x.id === id)?.name ?? id

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      specification: "",
      brandId: "",
      categoryIds: [],
      functionIds: [],
      price: "",
      isPOR: false,
      gstPercent: "",
      isNewProduct: false,
      status: "active",
    })
  setImages([])
  setImagePreviews([])
  setMainImageIndex(null)
  setImageError(null)
  if (fileRef.current) fileRef.current.value = ""
  }

  useEffect(() => {
    if (!open) return
    ;(async () => {
      try {
        const [b, c, f] = await Promise.all([
          fetch("/api/brands").then((r) => r.json()),
          fetch("/api/product-categories").then((r) => r.json()),
          fetch("/api/product-function").then((r) => r.json()),
        ])
        setBrands((b?.data ?? []).map((x: any) => ({ id: x._id, name: x.name })))
        setCategories((c?.data ?? []).map((x: any) => ({ id: x._id, name: x.name })))
        setFunctions((f?.data ?? []).map((x: any) => ({ id: x._id, name: x.name })))
      } catch {
        // non-blocking
      }
    })()
  }, [open])

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null)
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const okTypes = ["image/png", "image/jpeg"]
    const MAX = 2 * 1024 * 1024
    let validFiles: File[] = []
    let previews: string[] = [...imagePreviews]
    files.forEach((file) => {
      if (!okTypes.includes(file.type)) {
        setImageError("Please upload PNG or JPG images only.")
        return
      }
      if (file.size > MAX) {
        setImageError("File too large. Max size is 2MB.")
        return
      }
      validFiles.push(file)
    })
    if (!validFiles.length) return
    validFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        previews.push(reader.result as string)
        setImagePreviews([...previews])
      }
      reader.readAsDataURL(file)
    })
    setImages([...images, ...validFiles])
    if (mainImageIndex === null && images.length + validFiles.length > 0) {
      setMainImageIndex(0)
    }
  }

  // Remove selected image by index
  const removeImage = (idx: number) => {
    const newImages = images.filter((_, i) => i !== idx)
    const newPreviews = imagePreviews.filter((_, i) => i !== idx)
    setImages(newImages)
    setImagePreviews(newPreviews)
    setImageError(null)
    if (mainImageIndex === idx) {
      setMainImageIndex(newImages.length ? 0 : null)
    } else if (mainImageIndex && mainImageIndex > idx) {
      setMainImageIndex(mainImageIndex - 1)
    }
    if (fileRef.current) fileRef.current.value = ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setError(null)

    // basic checks
    if (!formData.name.trim()) return setError("Product name is required")
  // if (!formData.sku.trim()) return setError("SKU is required")
    if (!formData.brandId) return setError("Brand is required")
  if (!formData.categoryIds.length) return setError("Category is required")
  if (!formData.functionIds.length) return setError("Function is required")
    if (!formData.isPOR && (formData.price === "" || Number(formData.price) < 0))
      return setError("Price must be non-negative or mark POR")

    setIsSubmitting(true)
    try {
      const fd = new FormData()
      fd.append("name", formData.name.trim())
      if (formData.description.trim()) fd.append("description", formData.description.trim())
      if (formData.specification.trim()) fd.append("specification", formData.specification.trim())
      fd.append("brandId", formData.brandId)
      formData.categoryIds.forEach((id) => fd.append("categoryIds", id))
      formData.functionIds.forEach((id) => fd.append("functionIds", id))
      fd.append("isPOR", String(!!formData.isPOR))
      fd.append("price", formData.isPOR ? "0" : String(Number(formData.price)))
      fd.append("gstPercent", formData.gstPercent === "" ? "0" : String(Number(formData.gstPercent)))
      fd.append("isNewProduct", String(!!formData.isNewProduct))
      fd.append("status", formData.status)
      images.forEach((img, idx) => {
        fd.append("images", img)
      })
      if (mainImageIndex !== null) {
        fd.append("mainImageIndex", String(mainImageIndex))
      }

      const res = await fetch("/api/products", { method: "POST", body: fd })
      if (!res.ok) {
        const maybe = await res.json().catch(() => null)
        throw new Error(maybe?.error || "Failed to add product")
      }
      onCreated?.()
      onOpenChange(false)
      resetForm()
      onCreated?.()
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o) }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">Add New Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter product name"
                required
              />
            </div>
            <div className="space-y-2">
              {/* SKU field removed */}
            </div>
          </div>

          {/* <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter product description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specification">Specification</Label>
            <Textarea
              id="specification"
              value={formData.specification}
              onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
              placeholder="Key specs / dimensions / materials…"
              rows={3}
            />
          </div> */}

          {/* Description (scrollable) */}
<div className="space-y-2">
  <Label htmlFor="description">Description</Label>
  <Textarea
    id="description"
    value={formData.description}
    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
    placeholder="Enter product description"
    rows={6}
    className="min-h-[96px] max-h-[96px] overflow-y-auto resize-none"
  />
</div>

{/* Specification (scrollable) */}
<div className="space-y-2">
  <Label htmlFor="specification">Specification</Label>
  <Textarea
    id="specification"
    value={formData.specification}
    onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
    placeholder="Key specs / dimensions / materials…"
    rows={6}
    className="min-h-[96px] max-h-[96px] overflow-y-auto resize-none"
  />
</div>


          {/* Image */}
          <div className="space-y-2">
            <Label>Product Images</Label>
            <div className="flex flex-wrap gap-4">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative w-32 h-32 rounded-lg overflow-hidden border">
                  <Image src={preview} alt={`Product preview ${idx + 1}`} fill sizes="128px" className="object-cover" />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => removeImage(idx)}
                    aria-label="Remove product image"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={mainImageIndex === idx ? "default" : "outline"}
                    className="absolute bottom-2 left-2 text-xs px-2 py-1"
                    onClick={() => setMainImageIndex(idx)}
                  >
                    {mainImageIndex === idx ? "Main" : "Set as Main"}
                  </Button>
                </div>
              ))}
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload product images"
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
                className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-muted-foreground/60 transition-colors"
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click to upload images</span>
                <span className="text-xs text-muted-foreground/70">PNG, JPG up to 2MB</span>
              </div>
            </div>
            <Input ref={fileRef} type="file" accept="image/png,image/jpeg" multiple onChange={onPickFile} className="hidden" />
            {imageError && <p className="text-xs text-red-500">{imageError}</p>}
          </div>

          {/* Relations */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Brand</Label>
              <Select value={formData.brandId} onValueChange={(v) => setFormData({ ...formData, brandId: v })}>
                <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                <SelectContent>
                  {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <div className="flex flex-wrap items-start gap-2">
                {/* Dropdown multi-select */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className="min-w-[180px] justify-between">
                      {formData.categoryIds.length > 0
                        ? `${formData.categoryIds.length} selected`
                        : "Select categories"}
                      <span className="sr-only">Toggle categories</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 max-h-60 overflow-y-auto">
                    {categories.map((c) => {
                      const checked = formData.categoryIds.includes(c.id)
                      return (
                        <DropdownMenuCheckboxItem
                          key={c.id}
                          checked={checked}
                          onCheckedChange={(val: boolean) => {
                            setFormData((prev) => ({
                              ...prev,
                              categoryIds: val
                                ? [...prev.categoryIds, c.id]
                                : prev.categoryIds.filter((id) => id !== c.id),
                            }))
                          }}
                        >
                          {c.name}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* Chips with remove (×) */}
                <div className="flex flex-wrap gap-2">
                  {formData.categoryIds.map((id) => (
                    <span key={id} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs">
                      {nameById(id, categories)}
                      <button
                        type="button"
                        aria-label={`Remove ${nameById(id, categories)}`}
                        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded hover:bg-secondary-foreground/10"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setFormData(prev => ({
                            ...prev,
                            categoryIds: prev.categoryIds.filter(cid => cid !== id),
                          }))
                        }}
                        title="Remove"
                      >
                        <span className="leading-none">×</span>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Function</Label>
              <div className="flex flex-wrap items-start gap-2">
                {/* Dropdown multi-select */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className="min-w-[180px] justify-between">
                      {formData.functionIds.length > 0
                        ? `${formData.functionIds.length} selected`
                        : "Select functions"}
                      <span className="sr-only">Toggle functions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 max-h-60 overflow-y-auto">
                    {functions.map((f) => {
                      const checked = formData.functionIds.includes(f.id)
                      return (
                        <DropdownMenuCheckboxItem
                          key={f.id}
                          checked={checked}
                          onCheckedChange={(val: boolean) => {
                            setFormData((prev) => ({
                              ...prev,
                              functionIds: val
                                ? [...prev.functionIds, f.id]
                                : prev.functionIds.filter((id) => id !== f.id),
                            }))
                          }}
                        >
                          {f.name}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* Chips with remove (×) */}
                <div className="flex flex-wrap gap-2">
                  {formData.functionIds.map((id) => (
                    <span key={id} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs">
                      {nameById(id, functions)}
                      <button
                        type="button"
                        aria-label={`Remove ${nameById(id, functions)}`}
                        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded hover:bg-secondary-foreground/10"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setFormData(prev => ({
                            ...prev,
                            functionIds: prev.functionIds.filter(fid => fid !== id),
                          }))
                        }}
                        title="Remove"
                      >
                        <span className="leading-none">×</span>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>


          {/* Price, GST %, Is New Product */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPOR"
                  checked={formData.isPOR}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPOR: checked as boolean })}
                />
                <Label htmlFor="isPOR">Price on Request (POR)</Label>
              </div>
              {!formData.isPOR && (
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Enter price"
                  required={!formData.isPOR}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstPercent">GST %</Label>
              <Input
                id="gstPercent"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={formData.gstPercent}
                onChange={(e) => setFormData({ ...formData, gstPercent: e.target.value })}
                placeholder="Enter GST %"
              />
            </div>
            <div className="space-y-2 flex items-center h-full">
              <Checkbox
                id="isNewProduct"
                checked={formData.isNewProduct}
                onCheckedChange={(checked) => setFormData({ ...formData, isNewProduct: checked as boolean })}
              />
              <Label htmlFor="isNewProduct">Is New Product</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(v: "active" | "inactive") => setFormData({ ...formData, status: v })}
            >
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={isSubmitting}>
              {isSubmitting ? "Adding…" : "Add Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
