"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Plus, Search, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type OtherBrandUI = {
  id: string
  name: string
  description?: string
  websiteUrl?: string
  status: "active" | "inactive"
  createdAt: string
}

export default function OtherBrandsPage() {
  const router = useRouter()

  // Deleting state
  const [deleting, setDeleting] = useState(false)
  // Load brands on mount
  useEffect(() => {
    let alive = true
    ;(async () => {
      setIsLoading(true)
      setLoadError(null)
      try {
        const res = await fetch("/api/other-brands", { cache: "no-store" })
        if (res.status === 401) {
          router.replace("/login")
          return
        }
        if (!res.ok) throw new Error("Failed to load other brands")
        const json = await res.json()
        const list = (json?.data ?? []).map((b: any) => ({
          id: b.id ?? b._id,
          name: b.name,
          status: b.status ?? "",
          createdAt: b.createdAt ?? "",
        }))
        if (alive) setBrands(list)
      } catch (e: any) {
        if (alive) setLoadError(e?.message ?? "Failed to load")
      } finally {
        if (alive) setIsLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [router])

  // Delete error state
  const [deleteError, setDeleteError] = useState<string | null>(null)
  // Fetch brands function
  const fetchBrands = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const res = await fetch("/api/other-brands", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to fetch other brands")
      const { data } = await res.json()
      const mapped: OtherBrandUI[] = (data ?? []).map((b: any) => ({
        id: b._id ?? b.id,
        name: b.name,
        description: b.description ?? "",
        websiteUrl: b.websiteUrl ?? "",
        status: b.status === "inactive" ? "inactive" : "active",
        createdAt: b.createdAt ?? "",
      }))
      setBrands(mapped)
    } catch (e: any) {
      setLoadError(e?.message ?? "Failed to load")
    } finally {
      setIsLoading(false)
    }
  }

  // Add dialog
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addForm, setAddForm] = useState({
    name: "",
    description: "",
    websiteUrl: "",
    status: "active" as "active" | "inactive",
  })

  // Data
  const [brands, setBrands] = useState<OtherBrandUI[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  // Details/Edit dialog
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selected, setSelected] = useState<OtherBrandUI | null>(null)
  const [fullLoading, setFullLoading] = useState(false) // loading fresh details by id
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", description: "", websiteUrl: "", status: "active" as "active" | "inactive" })
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Create (Add)
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (addSubmitting) return

    setAddSubmitting(true)
    setAddError(null)
    try {
      const res = await fetch("/api/other-brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name.trim(),
          description: addForm.description.trim() || undefined,
          websiteUrl: addForm.websiteUrl.trim() || undefined,
          status: addForm.status,
        }),
      })
      if (!res.ok) {
        const maybe = await res.json().catch(() => null)
        throw new Error(maybe?.error || "Create failed")
      }
      // Refresh list quickly
      setIsAddOpen(false)
      setAddForm({ name: "", description: "", websiteUrl: "", status: "active" })
      router.refresh()
      await fetchBrands()
    } catch (err: any) {
      setAddError(err?.message ?? "Something went wrong")
    } finally {
      setAddSubmitting(false)
    }
  }

  // Filter
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return brands.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.description ?? "").toLowerCase().includes(q) ||
        (b.websiteUrl ?? "").toLowerCase().includes(q),
    )
  }, [brands, search])

  // Open details (prefetch from DB)
  const openDetails = async (brand: OtherBrandUI) => {
    setDetailsOpen(true)
    setDeleteError(null)
    setEditError(null)
    setSelected(brand)
    setEditMode(false)
    setFullLoading(true)
    try {
      const res = await fetch(`/api/other-brands/${brand.id}`, { cache: "no-store" })
      if (res.ok) {
        const { data } = await res.json()
        const fresh: OtherBrandUI = {
          id: data._id ?? data.id,
          name: data.name,
          description: data.description ?? "",
          websiteUrl: data.websiteUrl ?? "",
          status: data.status === "inactive" ? "inactive" : "active",
          createdAt: data.createdAt ?? brand.createdAt,
        }
        setSelected(fresh)
        setEditForm({
          name: fresh.name,
          description: fresh.description ?? "",
          websiteUrl: fresh.websiteUrl ?? "",
          status: fresh.status,
        })
      } else {
        // fallback to card data
        setEditForm({
          name: brand.name,
          description: brand.description ?? "",
          websiteUrl: brand.websiteUrl ?? "",
          status: brand.status,
        })
      }
    } finally {
      setFullLoading(false)
    }
  }

  // Save edit (UPDATED: send only defined fields; no `null`)
  const saveEdit = async () => {
    if (!selected) return
    if (!editForm.name.trim()) {
      setEditError("Name is required")
      return
    }
    setSavingEdit(true)
    setEditError(null)

    // optimistic update in list and selected
    const prev = [...brands]
    const idx = prev.findIndex((x) => x.id === selected.id)
    if (idx >= 0) {
      const updated: OtherBrandUI = {
        ...prev[idx],
        name: editForm.name.trim(),
        description: editForm.description ?? "",
        websiteUrl: editForm.websiteUrl ?? "",
        status: editForm.status,
      }
      const optimistic = [...prev]
      optimistic[idx] = updated
      setBrands(optimistic)
      setSelected(updated)
    }

    try {
      // build clean payload (avoid nulls that fail Zod .partial())
      const payload: Record<string, unknown> = {
        name: editForm.name.trim(),
        status: editForm.status,
      }
      const desc = editForm.description?.trim() ?? ""
      if (desc.length) payload.description = desc
      const url = editForm.websiteUrl?.trim() ?? ""
      if (url.length) payload.websiteUrl = url

      const res = await fetch(`/api/other-brands/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const maybe = await res.json().catch(() => null)
        throw new Error(maybe?.error || "Update failed")
      }
      setEditMode(false)
    } catch (e: any) {
      setEditError(e?.message ?? "Failed to save changes")
      await fetchBrands()
    } finally {
      setSavingEdit(false)
    }
  }

  // Delete
  const deleteBrand = async () => {
    if (!selected || deleting) return
    const ok = window.confirm(`Delete "${selected.name}"? This action cannot be undone.`)
    if (!ok) return

    setDeleting(true)
    setDeleteError(null)

    // optimistic removal
    const prev = [...brands]
    setBrands(prev.filter((x) => x.id !== selected.id))

    try {
      const res = await fetch(`/api/other-brands/${selected.id}`, { method: "DELETE" })
      if (!res.ok) {
        const maybe = await res.json().catch(() => null)
        throw new Error(maybe?.error || "Delete failed")
      }
      setDetailsOpen(false)
      setSelected(null)
    } catch (e: any) {
      setDeleteError(e?.message ?? "Failed to delete")
      await fetchBrands()
    } finally {
      setDeleting(false)
    }
  }

  const closeDetails = () => {
    setDetailsOpen(false)
    setEditMode(false)
    setEditError(null)
    setDeleteError(null)
  }

  const formatDateTime = (value?: string) => {
    if (!value) return "-"
    const d = new Date(value)
    return isNaN(d.getTime()) ? "-" : d.toLocaleString()
  }

  const total = brands.length
  const activeCount = brands.filter((b) => b.status === "active").length
  const inactiveCount = total - activeCount

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6">
        {/* Header + Add dialog */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight  text-[oklch(35.04%_0.01007_216.95)] ">Other Brands</h1>
            <p className="text-[oklch(44.226%_0.00005_271.152)] font-semibold ">Manage secondary and partner brand relationships</p>
          </div>
          <Button className="bg-[oklch(32.988%_0.05618_196.615)] text-white   hover:bg-accent/90" onClick={() => router.push("/other_brands/add") }>
            <Plus className="mr-2 h-4 w-4" />
            Add Other Brand
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search other brands…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-[oklch(35.04%_0.01007_216.95)] ">Total Brands</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
              <p className="text-xs text-[oklch(18.338%_0.00163_16.6)]">All other brands</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-[oklch(35.04%_0.01007_216.95)] ">Active</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}</div>
              <p className="text-xs text-[oklch(18.338%_0.00163_16.6)]">Currently active</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-[oklch(35.04%_0.01007_216.95)] ">Inactive</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inactiveCount}</div>
              <p className="text-xs text-[oklch(18.338%_0.00163_16.6)]">Disabled / archived</p>
            </CardContent>
          </Card>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Loading…</div>
        ) : loadError ? (
          <div className="text-center text-red-500 py-8">{loadError}</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
                  <h3 className="text-lg text-[oklch(0%_0_0)] font-semibold mb-2">No brands found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {search ? "No brands match your search." : "Get started by adding your first other brand."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b) => (
              <Card
                key={b.id}
                className="border-border hover:shadow-md transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={() => router.push(`/other_brands/${b.id}`)}
                role="button"
                tabIndex={0}
                aria-label={`Open ${b.name}`}
              >
                <CardHeader>
                  <CardTitle className="text-base font-bold text-[oklch(0%_0_0)] ">{b.name}</CardTitle>
                  <CardDescription className="truncate">
                    {b.websiteUrl ? (
                      <a href={b.websiteUrl} className="underline underline-offset-4" target="_blank" rel="noreferrer">
                        {b.websiteUrl}
                      </a>
                    ) : (
                      "—"
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[oklch(18.338%_0.00163_16.6)] line-clamp-3">{b.description || "No description"}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Created: {new Date(b.createdAt).toLocaleDateString()}</span>
                    <span
                      className={
                        b.status === "active"
                          ? "rounded bg-emerald-500/10 text-emerald-600 px-2 py-0.5"
                          : "rounded bg-zinc-500/10 text-zinc-600 px-2 py-0.5"
                      }
                    >
                      {b.status}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); router.push(`/other_brands/${b.id}/edit`) }}>
                      <Pencil className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Details / Edit / Delete dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="sm:max-w-[560px] max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editMode ? `Edit: ${selected?.name ?? ""}` : selected?.name ?? "Brand Details"}</DialogTitle>
              <DialogDescription>
                {editMode ? "Update the fields and save your changes." : "Complete information for this brand."}
              </DialogDescription>
            </DialogHeader>

            {!editMode ? (
              <div className="grid gap-4">
                {fullLoading ? (
                  <p className="text-sm text-muted-foreground">Loading details…</p>
                ) : (
                  <>
                    <div className="grid gap-1">
                      <Label className="text-xs text-muted-foreground">Website</Label>
                      <p className="text-sm break-all">
                        {selected?.websiteUrl ? (
                          <a href={selected.websiteUrl} className="underline underline-offset-4" target="_blank" rel="noreferrer">
                            {selected.websiteUrl}
                          </a>
                        ) : (
                          "—"
                        )}
                      </p>
                    </div>

                    <div className="grid gap-1">
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      {/* inner scroll for long text */}
                      <div className="max-h-[35vh] overflow-y-auto rounded-md border p-3 bg-muted/30">
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {selected?.description?.trim() ? selected.description : "—"}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-1">
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <p className="text-sm">{selected?.status ?? "—"}</p>
                    </div>

                    <div className="grid gap-1">
                      <Label className="text-xs text-muted-foreground">Created At</Label>
                      <p className="text-sm">{formatDateTime(selected?.createdAt)}</p>
                    </div>

                    {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
                  </>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Enter name"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-website">Website URL</Label>
                  <Input
                    id="edit-website"
                    type="url"
                    value={editForm.websiteUrl}
                    onChange={(e) => setEditForm({ ...editForm, websiteUrl: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Enter description"
                    rows={6}
                    className="h-32 max-h-56 overflow-y-auto resize-none"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(v: "active" | "inactive") => setEditForm({ ...editForm, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editError && <p className="text-sm text-red-500">{editError}</p>}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-2">
              {!editMode ? (
                <>
                  <Button variant="outline" onClick={closeDetails}>Close</Button>
                  <Button onClick={() => setEditMode(true)} className="inline-flex items-center gap-2" disabled={fullLoading}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={deleteBrand}
                    disabled={deleting || !selected}
                    className="inline-flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleting ? "Deleting…" : "Delete"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditMode(false)
                      setEditError(null)
                      if (selected) {
                        setEditForm({
                          name: selected.name,
                          description: selected.description ?? "",
                          websiteUrl: selected.websiteUrl ?? "",
                          status: selected.status,
                        })
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={saveEdit} disabled={savingEdit}>
                    {savingEdit ? "Saving…" : "Save changes"}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
