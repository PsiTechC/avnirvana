"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
// Keep types consistent with your Add page
interface Option { id: string; name: string }

type Status = "active" | "inactive"

export default function EditProductPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const productId = params?.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Options
  const [brands, setBrands] = useState<Option[]>([])
  const [categories, setCategories] = useState<Option[]>([])
  const [functions, setFunctions] = useState<Option[]>([])

  // Form data (mirrors Add page) :contentReference[oaicite:2]{index=2}
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    specification: "",
    brandId: "",
    categoryIds: [] as string[],
    functionIds: [] as string[],
    price: "",
    isPOR: false,
    status: "active" as Status,
    gstPercent: "",
    isNewProduct: false,
  })

  // Images
  const fileRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([]) // URLs already on server
  const [removedExisting, setRemovedExisting] = useState<Set<number>>(new Set()) // indexes of existingImages removed
  const [mainImageIndex, setMainImageIndex] = useState<number | null>(null) // across combined list
  const [imageError, setImageError] = useState<string | null>(null)

  // Load options + product
  useEffect(() => {
    let alive = true
      ; (async () => {
        try {
          const [b, c, f] = await Promise.all([
            fetch("/api/brands").then(r => r.json()),
            fetch("/api/product-categories").then(r => r.json()),
            fetch("/api/product-function").then(r => r.json()),
          ])
          if (!alive) return
          setBrands((b?.data ?? []).map((x: any) => ({ id: x._id, name: x.name })))
          setCategories((c?.data ?? []).map((x: any) => ({ id: x._id, name: x.name })))
          setFunctions((f?.data ?? []).map((x: any) => ({ id: x._id, name: x.name })))
        } catch {
          /* ignore option fetch errors for now */
        }
      })()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!productId) return
    let alive = true
      ; (async () => {
        setLoading(true)
        setError(null)
        try {
          const res = await fetch(`/api/products/${productId}`, { cache: "no-store" })
          if (!res.ok) throw new Error("Failed to load product")
          const { data } = await res.json()
          if (!alive) return

          // Map server response to form model (aligned with your details page mapping) :contentReference[oaicite:3]{index=3}
          const name = data.name ?? ""
          const description = data.description ?? ""
          const specification = data.specification ?? ""
          const brandId = (typeof data.brandId === "string" ? data.brandId : data.brandId?._id) ?? ""
          // Always map to string ids only (never objects)
          const cats: string[] = Array.isArray(data.categoryIds)
            ? data.categoryIds.map((c: any) => typeof c === "string" ? c : (c?._id ?? c?.id ?? ""))
            : Array.isArray(data.categories)
              ? data.categories.map((c: any) => (typeof c === "string" ? c : (c?._id ?? c?.id ?? "")))
              : [];
          const funcs: string[] = Array.isArray(data.functionIds)
            ? data.functionIds.map((f: any) => typeof f === "string" ? f : (f?._id ?? f?.id ?? ""))
            : Array.isArray(data.functions)
              ? data.functions.map((f: any) => (typeof f === "string" ? f : (f?._id ?? f?.id ?? "")))
              : [];

          const isPOR = !!data.isPOR
          const price = isPOR ? "" : (typeof data.price === "number" ? String(data.price) : "")
          const status: Status = (data.status === "inactive" ? "inactive" : "active")

          setFormData({
            name, description, specification, brandId,
            categoryIds: cats.filter(Boolean),
            functionIds: funcs.filter(Boolean),
            price,
            isPOR,
            status,
            gstPercent: data.gstPercent ? String(data.gstPercent) : "",
            isNewProduct: !!data.isNewProduct,
          })

          const imgs: string[] = Array.isArray(data.images) ? data.images : []
          setExistingImages(imgs)
          setImagePreviews(imgs) // start with existing as previews
          // If API returns a dedicated main image index or url, map it. Otherwise default to 0 when images exist.
          const mainIdx = typeof data.mainImageIndex === "number"
            ? data.mainImageIndex
            : (imgs.length ? 0 : null)
          setMainImageIndex(mainIdx)
        } catch (e: any) {
          setError(e?.message ?? "Failed to load product")
        } finally {
          setLoading(false)
        }
      })()
    return () => { alive = false }
  }, [productId])

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null)
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const okTypes = ["image/png", "image/jpeg"]
    const MAX = 2 * 1024 * 1024
    const valid: File[] = []
    files.forEach(file => {
      if (!okTypes.includes(file.type)) {
        setImageError("Please upload PNG or JPG images only.")
        return
      }
      if (file.size > MAX) {
        setImageError("File too large. Max size is 2MB.")
        return
      }
      valid.push(file)
    })
    if (!valid.length) return

    // Append new previews at the end of the combined list
    valid.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => setImagePreviews(prev => [...prev, reader.result as string])
      reader.readAsDataURL(file)
    })
    setImages(prev => [...prev, ...valid])

    // If no main image yet, set first available
    if (mainImageIndex === null) {
      const newCombinedCount = existingImages.filter((_, idx) => !removedExisting.has(idx)).length + valid.length
      if (newCombinedCount > 0) setMainImageIndex(0)
    }
  }

  // Remove either existing or newly added image
  const removePreviewAt = (combinedIdx: number) => {
    const existingCount = existingImages.filter((_, i) => !removedExisting.has(i)).length
    if (combinedIdx < existingCount) {
      // Removing an existing image
      // Find the corresponding original index among existingImages that maps to this combinedIdx.
      let seen = -1
      for (let i = 0; i < existingImages.length; i++) {
        if (removedExisting.has(i)) continue
        seen++
        if (seen === combinedIdx) {
          const next = new Set(removedExisting)
          next.add(i)
          setRemovedExisting(next)
          break
        }
      }
      setImagePreviews(prev => prev.filter((_, i) => i !== combinedIdx))
    } else {
      // Removing a newly added image
      const newIdx = combinedIdx - existingCount
      setImages(prev => prev.filter((_, i) => i !== newIdx))
      setImagePreviews(prev => prev.filter((_, i) => i !== combinedIdx))
    }

    // Adjust main image if needed
    if (mainImageIndex === combinedIdx) {
      const newLen = imagePreviews.length - 1
      setMainImageIndex(newLen ? 0 : null)
    } else if (mainImageIndex !== null && mainImageIndex > combinedIdx) {
      setMainImageIndex(mainImageIndex - 1)
    }
  }

  const setAsMain = (combinedIdx: number) => setMainImageIndex(combinedIdx)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    setError(null)

    // Basic validation (as in Add) :contentReference[oaicite:4]{index=4}
    if (!formData.name.trim()) return setError("Product name is required")
    if (!formData.brandId) return setError("Brand is required")
    // Removed category and function required validation
    if (!formData.isPOR && (formData.price === "" || Number(formData.price) < 0))
      return setError("Price must be non-negative or mark POR")

    setSaving(true)
    try {
      const fd = new FormData()
      fd.append("name", formData.name.trim())
      fd.append("description", formData.description.trim())
      fd.append("specification", formData.specification.trim())
      fd.append("brandId", formData.brandId)
      formData.categoryIds.forEach((id) => fd.append("categoryIds", id))
      formData.functionIds.forEach((id) => fd.append("functionIds", id))
      fd.append("isPOR", String(!!formData.isPOR))
      fd.append("price", formData.isPOR ? "0" : String(Number(formData.price)))
      fd.append("status", formData.status)
  fd.append("gstPercent", formData.gstPercent ? String(Number(formData.gstPercent)) : "0")
  fd.append("isNewProduct", String(!!formData.isNewProduct))

      // Images: send newly added images and info about removed existing ones + main index
      images.forEach((img) => fd.append("images", img))
      // For existing removals, send their indices (server should handle it)
      if (removedExisting.size) {
      //   Array.from(removedExisting).forEach((idx) => fd.append("removeImageIndexes", String(idx)))
        fd.append("removeImageIndexes", JSON.stringify(Array.from(removedExisting))); 
      }
      // Main image index is based on the combined list (existing minus removed + new)
      if (mainImageIndex !== null) {
        fd.append("mainImageIndex", String(mainImageIndex))
      }

      const res = await fetch(`/api/products/${productId}`, { method: "PUT", body: fd })
      if (!res.ok) {
        const maybe = await res.json().catch(() => null)
        throw new Error(maybe?.error || "Failed to update product")
      }

      router.push(`/products/${productId}`)
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-muted-foreground">Loading…</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[oklch(35.04%_0.01007_216.95)] ">Edit Product</h1>
            <p className="text-sm text-[oklch(44.226%_0.00005_271.152)] font-semibold ">Update details and save changes</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/products/${productId}`)}>Back to details</Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Left: details (mirrors Add) :contentReference[oaicite:5]{index=5} */}
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1">
                <Label className="text-xs font-bold text-[oklch(35.04%_0.01007_216.95)] ">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                  maxLength={120}
                  className="bg-white/20 border-black/30 text-black placeholder-white/60 backdrop-blur-sm rounded-lg text-sm py-1.5 px-2"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs font-bold text-[oklch(35.04%_0.01007_216.95)] ">Brand</Label>
                <select
                  id="brand"
                  value={formData.brandId}
                  onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                  className="w-full bg-white/20 border-black/30 text-black rounded-lg text-sm py-1.5 px-2"
                >
                  <option value="">Select brand</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1">
                <Label className="text-xs font-bold text-[oklch(35.04%_0.01007_216.95)] ">Category</Label>
                <div className="flex items-start gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" className="min-w-[120px] justify-between">
                        {formData.categoryIds.length > 0 ? `${formData.categoryIds.length} selected` : "Select categories"}
                        <span className="sr-only">Toggle categories</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 max-h-60 overflow-y-auto">
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
                  <div className="flex flex-wrap gap-2 min-h-[28px]">
                    {formData.categoryIds.map((id) => (
                      <span key={id} className="inline-flex items-center gap-1 rounded-md bg-[oklch(32.988%_0.05618_196.615)] text-white px-2 py-0.5 text-xs whitespace-nowrap">
                        {categories.find((c) => c.id === id)?.name || id}
                        <button
                          type="button"
                          className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded hover:bg-secondary-foreground/10"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setFormData(prev => ({ ...prev, categoryIds: prev.categoryIds.filter(cid => cid !== id) }))
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

              <div className="grid gap-1">
                <Label className="text-xs font-bold text-[oklch(35.04%_0.01007_216.95)] ">Function</Label>
                <div className="flex items-start gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" className="min-w-[120px] justify-between">
                        {formData.functionIds.length > 0 ? `${formData.functionIds.length} selected` : "Select functions"}
                        <span className="sr-only">Toggle functions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 max-h-60 overflow-y-auto">
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
                  <div className="flex flex-wrap gap-2 min-h-[28px]">
                    {formData.functionIds.map((id) => (
                      <span key={id} className="inline-flex items-center gap-1 rounded-md bg-[oklch(32.988%_0.05618_196.615)] text-white px-2 py-0.5 text-xs whitespace-nowrap">
                        {functions.find((f) => f.id === id)?.name || id}
                        <button
                          type="button"
                          className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded hover:bg-secondary-foreground/10"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setFormData(prev => ({ ...prev, functionIds: prev.functionIds.filter(fid => fid !== id) }))
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1">
                <Label className="text-xs font-bold text-[oklch(35.04%_0.01007_216.95)] ">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={3}
                  maxLength={500}
                  className="h-50 max-h-24 overflow-y-auto resize-none bg-white/20 border-black/30 text-black placeholder-white/60 backdrop-blur-sm rounded-lg scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100 text-sm py-1.5 px-2"
                  style={{ minHeight: "5rem", maxHeight: "10rem", overflowY: "auto" }}
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs font-bold text-[oklch(35.04%_0.01007_216.95)] ">Specification</Label>
                <Textarea
                  id="specification"
                  value={formData.specification}
                  onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                  placeholder="Key specs / dimensions / materials…"
                  rows={3}
                  maxLength={500}
                  className="h-50 max-h-24 overflow-y-auto resize-none bg-white/20 border-black/30 text-black placeholder-white/60 backdrop-blur-sm rounded-lg scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100 text-sm py-1.5 px-2"
                  style={{ minHeight: "5rem", maxHeight: "10rem", overflowY: "auto" }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <div className="grid gap-1">
                <Label className="text-xs font-bold text-[oklch(35.04%_0.01007_216.95)] ">Price</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Enter price"
                  disabled={formData.isPOR}
                  className="bg-white/20 border-black/30 text-black placeholder-white/60 backdrop-blur-sm rounded-lg text-sm py-1.5 px-2"
                />

                <div className="flex items-center gap-2 mt-0">
                  <input
                    type="checkbox"
                    id="isPOR"
                    checked={formData.isPOR}
                    onChange={(e) => setFormData({ ...formData, isPOR: e.target.checked, price: e.target.checked ? "" : formData.price })}
                  />
                  <Label htmlFor="isPOR">Price on Request (POR)</Label>
                </div>

                <div className="grid gap-1">
                  <Label className="text-xs font-bold text-[oklch(35.04%_0.01007_216.95)] ">GST %</Label>
                  <Input
                    id="gstPercent"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.gstPercent}
                    onChange={(e) => setFormData({ ...formData, gstPercent: e.target.value })}
                    placeholder="Enter GST %"
                    className="bg-white/20 border-black/30 text-black placeholder-white/60 backdrop-blur-sm rounded-lg text-sm py-1.5 px-2"
                  />
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="isNewProduct"
                    checked={formData.isNewProduct}
                    onChange={(e) => setFormData({ ...formData, isNewProduct: e.target.checked })}
                  />
                  <Label htmlFor="isNewProduct">Is New Product</Label>
                </div>

                <div className="grid gap-1">
                  <Label className="text-xs font-bold text-[oklch(35.04%_0.01007_216.95)] ">Status</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="active"
                        checked={formData.status === "active"}
                        onChange={() => setFormData({ ...formData, status: "active" })}
                        className="accent-blue-500"
                      />
                      <span className="text-sm  text-[oklch(35.04%_0.01007_216.95)]">Active</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value="inactive"
                        checked={formData.status === "inactive"}
                        onChange={() => setFormData({ ...formData, status: "inactive" })}
                        className="accent-blue-500"
                      />
                      <span className="text-sm  text-[oklch(35.04%_0.01007_216.95)]">Inactive</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: images */}
          <aside className="md:col-span-1">
            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="w-full">
                {imagePreviews.length > 0 ? (
                  <>
                    <div className="grid grid-cols-3 gap-2 max-h-[240px] overflow-y-auto">
                      {imagePreviews.map((src, idx) => (
                        <div key={idx} className="relative h-20 w-20 rounded-lg overflow-hidden border bg-muted/20">
                          {/* Using standard img here for simplicity like Add page */}
                          <img src={src} alt={`Preview ${idx + 1}`} className="object-contain w-full h-full" />
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600  text-[oklch(0%_0_0)] rounded-full p-1 text-xs"
                            onClick={() => removePreviewAt(idx)}
                            aria-label="Remove image"
                          >
                            ×
                          </button>
                          {mainImageIndex === idx ? (
                            <span className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-2 py-0.5 rounded">Main</span>
                          ) : (
                            <button
                              type="button"
                              className="absolute bottom-1 left-1 bg-gray-600 text-white text-xs px-2 py-0.5 rounded"
                              onClick={() => setAsMain(idx)}
                            >
                              Set Main
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="mt-2 w-full bg-[oklch(32.988%_0.05618_196.615)] hover:bg-[oklch(32.988%_0.05618_196.615)]/80 text-white rounded-lg py-1 text-xs font-semibold transition-colors"
                      onClick={() => fileRef.current?.click()}
                    >
                      Add Another Image
                    </button>
                  </>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Upload product images"
                    onClick={() => fileRef.current?.click()}
                    onKeyDown={e => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
                    className="flex flex-col items-center justify-center w-20 h-20 min-h-[80px] border-2 border-dashed border-black  rounded-lg cursor-pointer hover:border-white/50 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <span className="text-xs font-bold text-[oklch(0%_0_0)] ">Upload</span>
                    <span className="text-[10px] font-bold text-[oklch(0%_0_0)] ">PNG, JPG up to 2MB</span>
                  </div>
                )}

                <Input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  multiple
                  onChange={onPickFile}
                  className="hidden"
                />
                {imageError && <p className="text-[10px] text-red-300 mt-2">{imageError}</p>}
              </div>
              <p className="mt-2 text-xs text-muted-foreground text-center">Product images</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="flex justify-end gap-2 pt-20">
                <Button type="button" onClick={() => router.push(`/products/${productId}`)} className="bg-white text-[oklch(0%_0_0)] hover:bg-[oklch(0.577_0.245_27.325)]/80 backdrop-blur-sm rounded-lg text-sm px-3 py-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="bg-[oklch(32.988%_0.05618_196.615)] text-white  backdrop-blur-sm rounded-lg disabled:opacity-60 text-sm px-3 py-1">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </aside>
        </div>

        {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
      </div>
    </DashboardLayout>
  )
}
