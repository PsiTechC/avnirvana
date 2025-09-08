"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"

export default function AddOtherProductPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    specification: "",
    categoryIds: [] as string[],
    functionIds: [] as string[],
    price: "",
    // sku: "",
    status: "active" as "active" | "inactive",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [functions, setFunctions] = useState<{ id: string; name: string }[]>([])
  const [catLoading, setCatLoading] = useState(false)
  const [fnLoading, setFnLoading] = useState(false)
  const [catError, setCatError] = useState<string | null>(null)
  const [fnError, setFnError] = useState<string | null>(null)

  // Load categories and functions
  React.useEffect(() => {
    const loadCategories = async () => {
      setCatLoading(true)
      setCatError(null)
      try {
        const res = await fetch("/api/product-categories", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load categories")
        const json = await res.json()
        setCategories((json?.data ?? []).map((c: any) => ({ id: c._id ?? c.id, name: c.name })))
      } catch (e: any) {
        setCatError(e?.message ?? "Could not load categories")
      } finally {
        setCatLoading(false)
      }
    }
    const loadFunctions = async () => {
      setFnLoading(true)
      setFnError(null)
      try {
        const res = await fetch("/api/product-functions", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load functions")
        const json = await res.json()
        setFunctions((json?.data ?? []).map((f: any) => ({ id: f._id ?? f.id, name: f.name })))
      } catch (e: any) {
        setFnError(e?.message ?? "Could not load functions")
      } finally {
        setFnLoading(false)
      }
    }
    loadCategories()
    loadFunctions()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        specification: formData.specification.trim() || undefined,
        categoryIds: formData.categoryIds,
        functionIds: formData.functionIds,
        price: formData.price === "" ? undefined : Number(formData.price),
        // sku: formData.sku.trim() || undefined,
        status: formData.status,
      }
      const res = await fetch("/api/other-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const maybe = await res.json().catch(() => null)
        throw new Error(maybe?.error || "Failed to create product")
      }
      router.push("/other_products")
    } catch (err: any) {
      setSubmitError(err?.message ?? "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex justify-center items-center min-h-[80vh] bg-transparent">
        <div className="w-full max-w-5xl">
          <div className="bg- bg-[oklch(98%_0.01_220)]/80 rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[oklch(35.04%_0.01007_216.95)]">Add Other Product</h1>
              <p className="text-sm text-[oklch(44.226%_0.00005_271.152)] font-semibold">Fill in the details below</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 md:grid-cols-3">
                {/* Left: details */}
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1">
                      <Label className="text-l font-bold text-[oklch(35.04%_0.01007_216.95)] ">Product Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter product name"
                        required
                        maxLength={120}
                        className="bg-white/20 border-black/30 text-black placeholder-white/60 backdrop-blur-sm rounded-lg text-sm py-1.5 px-2"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-l font-bold text-[oklch(35.04%_0.01007_216.95)] ">Status</Label>
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
                          <span className="text-sm font-semibold text-[oklch(35.04%_0.01007_216.95)] ">Active</span>
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
                          <span className="text-sm font-semibold text-[oklch(35.04%_0.01007_216.95)] ">Inactive</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1">
                      <Label className="text-l font-bold text-[oklch(35.04%_0.01007_216.95)] ">Category</Label>
                      <div className="flex items-start gap-2">
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
                    <div className="grid gap-1">
                      <Label className="text-l font-bold text-[oklch(35.04%_0.01007_216.95)] ">Function</Label>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1">
                      <Label className="text-l font-bold text-[oklch(35.04%_0.01007_216.95)] ">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Enter product description"
                        rows={3}
                        maxLength={500}
                        className="h-50 max-h-24 overflow-y-auto resize-none bg-white/20 border-black/30 text-black placeholder-white/60 backdrop-blur-sm rounded-lg scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100 text-sm py-1.5 px-2"
                        style={{ minHeight: "5rem", maxHeight: "10rem", overflowY: "auto" }}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-l font-bold text-[oklch(35.04%_0.01007_216.95)] ">Specification</Label>
                      <Textarea
                        id="specification"
                        value={formData.specification}
                        onChange={e => setFormData({ ...formData, specification: e.target.value })}
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
                      <Label className="text-l font-bold text-[oklch(35.04%_0.01007_216.95)] ">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                        placeholder="Enter price"

                        className="bg-white/20 border-black/30 text-black placeholder-white/60 backdrop-blur-sm rounded-lg text-sm py-1.5 px-2"
                      />
                    </div>
                  </div>
                </div>
                {/* Right: image upload placeholder (optional, can be added later) */}
                <aside className="md:col-span-1">
                  {/* You can add image upload UI here if needed, similar to Add Product */}
                  {/* Buttons below image section */}
                  <div className="flex justify-end gap-2 pt-20">
                    <Button type="button" onClick={() => router.push("/other_products")} className="bg-white text-[oklch(0%_0_0)] hover:bg-[oklch(0.577_0.245_27.325)]/80 backdrop-blur-sm rounded-lg text-sm px-3 py-1">Cancel</Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-[oklch(32.988%_0.05618_196.615)] text-white  backdrop-blur-sm rounded-lg disabled:opacity-60 text-sm px-3 py-1">{isSubmitting ? "Adding..." : "Add Other Product"}</Button>
                  </div>
                </aside>
              </div>
              {submitError && <div className="text-red-600 text-sm mt-2">{submitError}</div>}
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
