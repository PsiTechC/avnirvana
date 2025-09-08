"use client"
import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import{DashboardLayout}from"@/components/dashboard-layout"
import { Upload, X, Plus } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
// Option type for dropdowns
interface Option { id: string; name: string }

export default function AddProductPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    specification: "",
    brandId: "",
    categoryIds: [] as string[],
    functionIds: [] as string[],
    price: "",
    isPOR: false,
    status: "active" as "active" | "inactive",
    gstPercent: "",
    isNewProduct: false,
  })
    const router = typeof window !== "undefined" ? require("next/navigation").useRouter() : null;

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

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const [b, c, f] = await Promise.all([
          fetch("/api/brands").then((r) => r.json()),
          fetch("/api/product-categories").then((r) => r.json()),
          fetch("/api/product-function").then((r) => r.json()),
        ])
        setBrands((b?.data ?? []).map((x: any) => ({ id: x._id, name: x.name })))
        setCategories((c?.data ?? []).map((x: any) => ({ id: x._id, name: x.name })))
        setFunctions((f?.data ?? []).map((x: any) => ({ id: x._id, name: x.name })))
      } catch {}
    })()
  }, [])

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
    if (!formData.name.trim()) return setError("Product name is required")
    if (!formData.brandId) return setError("Brand is required")
    // Category and function are now optional
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
  fd.append("status", formData.status)
  fd.append("gstPercent", formData.gstPercent ? String(Number(formData.gstPercent)) : "0")
  fd.append("isNewProduct", String(!!formData.isNewProduct))
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
    // Redirect to products main page after successful add
    if (router) router.push("/products")
      setFormData({
        name: "",
        description: "",
        specification: "",
        brandId: "",
        categoryIds: [],
        functionIds: [],
        price: "",
        isPOR: false,
        status: "active",
        gstPercent: "",
        isNewProduct: false,
      })
      setImages([])
      setImagePreviews([])
      setMainImageIndex(null)
      setImageError(null)
      if (fileRef.current) fileRef.current.value = ""
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex justify-center items-center min-h-[80vh] bg-transparent">
        <div className="w-full max-w-5xl">
          <div className=" bg-[oklch(98%_0.01_220)]/80 rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[oklch(35.04%_0.01007_216.95)]">Add New Product</h1>
              <p className="text-sm text-[oklch(44.226%_0.00005_271.152)] font-semibold">Fill in the details below</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Left: details */}
              <div className="md:col-span-2 space-y-4">
                {/* ...existing code... */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Product Name */}
                  {/* ...existing code... */}
                  <div className="grid gap-1">
                    <Label className="text-xs font-bold text-[oklch(0%_0_0)]">Product Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter product name"
                      required
                      maxLength={120}
                      className="bg-white/20 border-black/30 text-black placeholder-white/60 backdrop-blur-sm rounded-lg text-sm py-1.5 px-2"
                    />
                  </div>
                  {/* Brand */}
                  {/* ...existing code... */}
                  <div className="grid gap-1">
                    <Label className="text-xs font-bold text-[oklch(0%_0_0)]">Brand</Label>
                    <select
                      id="brand"
                      value={formData.brandId}
                      onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                      className="w-full bg-white/20 border-black/30 text-black rounded-lg text-sm py-1.5 px-2"
                      required
                    >
                      <option value="">Select brand</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* ...existing code... */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  {/* ...existing code... */}
                  <div className="grid gap-1">
                    <Label className="text-xs font-bold text-[oklch(0%_0_0)]">Category</Label>
                    <div className="flex items-start gap-2">
                      {/* ...existing code... */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="outline" className="min-w-[120px] justify-between">
                            {formData.categoryIds.length > 0
                              ? `${formData.categoryIds.length} selected`
                              : "Select categories"}
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
                              aria-label={`Remove ${categories.find((c) => c.id === id)?.name || id}`}
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
                  {/* Function */}
                  {/* ...existing code... */}
                  <div className="grid gap-1">
                    <Label className="text-xs font-bold text-[oklch(0%_0_0)]">Function</Label>
                    <div className="flex items-start gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="outline" className="min-w-[120px] justify-between">
                            {formData.functionIds.length > 0
                              ? `${formData.functionIds.length} selected`
                              : "Select functions"}
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
                              aria-label={`Remove ${functions.find((f) => f.id === id)?.name || id}`}
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
                {/* ...existing code... */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1">
                    <Label className="text-xs font-bold text-[oklch(0%_0_0)]">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter product description"
                      rows={3}
                      required
                      maxLength={500}
                      className="h-50 max-h-24 overflow-y-auto resize-none bg-white/20 border-black/30 text-black placeholder-white/60 backdrop-blur-sm rounded-lg scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100 text-sm py-1.5 px-2"
                      style={{ minHeight: "5rem", maxHeight: "10rem", overflowY: "auto" }}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs font-bold text-[oklch(0%_0_0)]">Specification</Label>
                    <Textarea
                      id="specification"
                      value={formData.specification}
                      onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                      placeholder="Key specs / dimensions / materials…"
                      rows={3}
                      required
                      maxLength={500}
                      className="h-50 max-h-24 overflow-y-auto resize-none bg-white/20 border-black/30 text-black placeholder-white/60 backdrop-blur-sm rounded-lg scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100 text-sm py-1.5 px-2"
                      style={{ minHeight: "5rem", maxHeight: "10rem", overflowY: "auto" }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 items-end">
                  <div className="grid gap-1">
                    <Label className="text-xs font-bold text-[oklch(0%_0_0)]">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="Enter price"
                      disabled={formData.isPOR}
                      required={!formData.isPOR}
                      className="bg-white/20 border-black/30 text-black placeholder-white/60 backdrop-blur-sm rounded-lg text-sm py-1.5 px-2"
                    />
                    <div className="flex items-center gap-2 mt-0">
                      <input
                        type="checkbox"
                        id="isPOR"
                        checked={formData.isPOR}
                        onChange={(e) => setFormData({ ...formData, isPOR: e.target.checked })}
                      />
                      <Label htmlFor="isPOR">Price on Request (POR)</Label>
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs font-bold text-[oklch(0%_0_0)]">GST %</Label>
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
                      <Label className="text-xs font-bold text-[oklch(0%_0_0)]">Status</Label>
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
                          <span className="text-sm font-bold text-[oklch(0%_0_0)]">Active</span>
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
                          <span className="text-sm font-bold text-[oklch(0%_0_0)]">Inactive</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Right: images (smaller preview) */}
              <aside className="md:col-span-1">
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="w-full">
                    {imagePreviews.length > 0 ? (
                      <>
                        <div className="grid grid-cols-3 gap-2 max-h-[240px] overflow-y-auto">
                          {imagePreviews.map((src, idx) => (
                            <div key={idx} className="relative h-20 w-20 rounded-lg overflow-hidden border bg-muted/20">
                              <img src={src} alt={`Preview ${idx + 1}`} className="object-contain w-full h-full" />
                              <button type="button" className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 text-xs" onClick={() => removeImage(idx)} aria-label="Remove image">×</button>
                              {mainImageIndex === idx && <span className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-2 py-0.5 rounded">Main</span>}
                              {mainImageIndex !== idx && <button type="button" className="absolute bottom-1 left-1 bg-gray-600 text-white text-xs px-2 py-0.5 rounded" onClick={() => setMainImageIndex(idx)}>Set Main</button>}
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
                        className="flex flex-col items-center justify-center w-20 h-20 min-h-[80px] border-2 border-dashed border-[oklch(0%_0_0)]  rounded-lg cursor-pointer hover:border-white/50 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                      >
                        <span className="text-xs text-[oklch(0%_0_0)]  text-/60">Upload</span>
                        <span className="text-[10px] text-[oklch(0%_0_0)]">PNG, JPG up to 2MB</span>
                      </div>
                    )}
                    <Input ref={fileRef} type="file" accept="image/png,image/jpeg" multiple onChange={onPickFile} className="hidden" />
                    {imageError && <p className="text-[10px] text-red-300 mt-2">{imageError}</p>}
                  </div>
                  <p className="mt-2 text-xs text-[oklch(0%_0_0)]  text-center">Product images</p>
                </div>
                {/* Buttons below image section */}
                <form onSubmit={handleSubmit}>
                  <div className="flex justify-end gap-2 pt-20">
                    <Button type="button" onClick={() => window.history.back()} className="bg-white text-[oklch(0%_0_0)] hover:bg-[oklch(0.577_0.245_27.325)]/80 backdrop-blur-sm rounded-lg text-sm px-3 py-1">Cancel</Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-[oklch(32.988%_0.05618_196.615)] text-white  backdrop-blur-sm rounded-lg disabled:opacity-60 text-sm px-3 py-1">{isSubmitting ? "Adding..." : "Add Product"}</Button>
                  </div>
                </form>
              </aside>
            </div>
            {/* Removed button group from below main grid */}
            {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

