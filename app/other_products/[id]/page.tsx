"use client"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

export default function OtherProductDetailPage() {
  const [product, setProduct] = useState<any>(null)
  const [categoryNames, setCategoryNames] = useState<{ [id: string]: string }>({})
  const [functionNames, setFunctionNames] = useState<{ [id: string]: string }>({})

  // Fetch category and function names for the product
  useEffect(() => {
    if (!product) return;
    const fetchNames = async () => {
      if (Array.isArray(product.categoryIds) && product.categoryIds.length > 0) {
        try {
          const res = await fetch('/api/product-categories', { cache: 'no-store' });
          if (res.ok) {
            const json = await res.json();
            const map: { [id: string]: string } = {};
            (json?.data ?? []).forEach((c: any) => { map[c._id ?? c.id] = c.name; });
            setCategoryNames(map);
          }
        } catch {}
      }
      if (Array.isArray(product.functionIds) && product.functionIds.length > 0) {
        try {
          const res = await fetch('/api/product-functions', { cache: 'no-store' });
          if (res.ok) {
            const json = await res.json();
            const map: { [id: string]: string } = {};
            (json?.data ?? []).forEach((f: any) => { map[f._id ?? f.id] = f.name; });
            setFunctionNames(map);
          }
        } catch {}
      }
    };
    fetchNames();
  }, [product]);
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const productId = params?.id
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!productId) return
    setLoading(true)
    setError(null)
    fetch(`/api/other-products/${productId}`)
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => setProduct(data.data))
      .catch(() => setError("Failed to load product"))
      .finally(() => setLoading(false))
  }, [productId])

  const handleEdit = () => {
    setEditForm({
      name: product.name ?? "",
      // sku: product.sku ?? "",
      price: typeof product.price === "number" ? String(product.price) : "",
      description: product.description ?? "",
      specification: product.specification ?? "",
      categoryIds: [...(product.categoryIds ?? [])],
      functionIds: [...(product.functionIds ?? [])],
      status: product.status ?? "active",
    })
    setEditMode(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...editForm, price: editForm.price ? Number(editForm.price) : undefined }
      const res = await fetch(`/api/other-products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Update failed")
      const { data } = await res.json()
      setProduct(data)
      setEditMode(false)
    } catch (e) {
      setError("Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm("Delete this product?")) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/other-products/${productId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      router.push("/other_products")
    } catch (e) {
      setError("Failed to delete product")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <DashboardLayout><div className="p-6">Loading…</div></DashboardLayout>
  if (error || !product) return <DashboardLayout><div className="p-6 text-red-500">{error || "Product not found"}</div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="flex justify-center items-center min-h-[70vh] bg-transparent">
        <div className="w-full max-w-3xl">
          <div className="bg-white/90 rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-[oklch(35.04%_0.01007_216.95)]">{editMode ? "Edit Other Product" : product.name}</h1>
              {!editMode && <p className="text-xs text-[oklch(44.226%_0.00005_271.152)] font-semibold">Details and management</p>}
            </div>
            {editMode ? (
              <form>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="md:col-span-2 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <Label className="text-base font-bold text-[oklch(35.04%_0.01007_216.95)]">Product Name</Label>
                        <Input
                          id="name"
                          value={editForm.name}
                          onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                          required
                          maxLength={120}
                          className="bg-white/20 border-black/30 text-black placeholder-white/60 backdrop-blur-sm rounded-lg text-base py-1.5 px-2"
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-base font-bold text-[oklch(35.04%_0.01007_216.95)]">Status</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="status"
                              value="active"
                              checked={editForm.status === "active"}
                              onChange={() => setEditForm({ ...editForm, status: "active" })}
                              className="accent-blue-500"
                            />
                            <span className="text-base font-bold text-[oklch(35.04%_0.01007_216.95)]">Active</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="status"
                              value="inactive"
                              checked={editForm.status === "inactive"}
                              onChange={() => setEditForm({ ...editForm, status: "inactive" })}
                              className="accent-blue-500"
                            />
                            <span className="text-base font-bold text-[oklch(35.04%_0.01007_216.95)]">Inactive</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <Label className="text-base font-bold text-[oklch(35.04%_0.01007_216.95)]">Category</Label>
                        <div className="flex flex-wrap gap-2 min-h-[24px]">
                          {editForm.categoryIds.map((id: string) => (
                            <span key={id} className="inline-flex items-center gap-1 rounded-md bg-[oklch(32.988%_0.05618_196.615)] text-white px-2 py-0.5 text-sm whitespace-nowrap">
                              {categoryNames[id] || id}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-base font-bold text-[oklch(35.04%_0.01007_216.95)]">Function</Label>
                        <div className="flex flex-wrap gap-2 min-h-[24px]">
                          {editForm.functionIds.map((id: string) => (
                            <span key={id} className="inline-flex items-center gap-1 rounded-md bg-[oklch(32.988%_0.05618_196.615)] text-white px-2 py-0.5 text-sm whitespace-nowrap">
                              {functionNames[id] || id}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <Label className="text-base font-bold text-[oklch(35.04%_0.01007_216.95)]">Description</Label>
                        <Textarea
                          id="description"
                          value={editForm.description}
                          onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                          rows={3}
                          required
                          maxLength={500}
                          className="h-40 max-h-24 overflow-y-auto resize-none bg-white/20 border-black/30 text-black placeholder-white/60 backdrop-blur-sm rounded-lg scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100 text-base py-1.5 px-2"
                          style={{ minHeight: "4rem", maxHeight: "8rem", overflowY: "auto" }}
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-base font-bold text-[oklch(35.04%_0.01007_216.95)]">Specification</Label>
                        <Textarea
                          id="specification"
                          value={editForm.specification}
                          onChange={e => setEditForm({ ...editForm, specification: e.target.value })}
                          rows={3}
                          required
                          maxLength={500}
                          className="h-40 max-h-24 overflow-y-auto resize-none bg-white/20 border-black/30 text-black placeholder-white/60 backdrop-blur-sm rounded-lg scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100 text-base py-1.5 px-2"
                          style={{ minHeight: "4rem", maxHeight: "8rem", overflowY: "auto" }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 items-end">
                      <div className="grid gap-1">
                        <Label className="text-base font-bold text-[oklch(35.04%_0.01007_216.95)]">Price</Label>
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          value={editForm.price}
                          onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                          required
                          className="bg-white/20 border-black/30 text-black placeholder-white/60 backdrop-blur-sm rounded-lg text-base py-1.5 px-2"
                        />
                      </div>
                    </div>
                  </div>
                  <aside className="md:col-span-1">
                    <div className="flex justify-end gap-2 pt-10">
                      <Button type="button" onClick={() => setEditMode(false)} className="bg-white text-[oklch(0%_0_0)] hover:bg-[oklch(0.577_0.245_27.325)]/80 backdrop-blur-sm rounded-lg text-base px-3 py-1">Cancel</Button>
                      <Button type="button" onClick={handleSave} disabled={saving} className="bg-[oklch(32.988%_0.05618_196.615)] text-white  backdrop-blur-sm rounded-lg disabled:opacity-60 text-base px-3 py-1">{saving ? "Saving..." : "Save"}</Button>
                    </div>
                  </aside>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-end">
                  <span className={`text-sm px-2 py-0.5 rounded ${product.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-800"}`}>{product.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-base">
                  <div>
                    <div className="text-muted-foreground font-bold">Price</div>
                    <div>{typeof product.price === "number" ? `₹ ${product.price.toFixed(2)}` : "—"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground font-bold">Created</div>
                    <div>{product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "—"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground font-bold">Categories</div>
                    <div>
                      {Array.isArray(product.categoryIds) && product.categoryIds.length > 0
                        ? product.categoryIds.map((id: string) => categoryNames[id] || id).join(", ")
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground font-bold">Functions</div>
                    <div>
                      {Array.isArray(product.functionIds) && product.functionIds.length > 0
                        ? product.functionIds.map((id: string) => functionNames[id] || id).join(", ")
                        : "—"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    {product.description && (
                      <div className="text-base">
                        <div className="text-muted-foreground mb-1 font-bold">Description</div>
                        <div className="max-h-[30vh] overflow-y-auto rounded-md border p-2 bg-muted/30">
                          <p className="leading-relaxed whitespace-pre-wrap break-words">{product.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    {product.specification && (
                      <div className="text-base">
                        <div className="text-muted-foreground mb-1 font-bold">Specification</div>
                        <div className="max-h-[30vh] overflow-y-auto rounded-md border p-2 bg-muted/30">
                          <p className="leading-relaxed whitespace-pre-wrap break-words">{product.specification}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-3">
                  <Button type="button" onClick={() => router.push("/other_products")} className="bg-white text-[oklch(0%_0_0)] hover:bg-[oklch(0.577_0.245_27.325)]/80 backdrop-blur-sm rounded-lg text-base px-3 py-1">Back</Button>
                  <Button type="button" onClick={handleEdit} className="bg-[oklch(32.988%_0.05618_196.615)] text-white backdrop-blur-sm rounded-lg text-base px-3 py-1">Edit</Button>
                  <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting} className="text-base px-3 py-1">{deleting ? "Deleting…" : "Delete"}</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
