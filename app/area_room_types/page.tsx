
// app/(dashboard)/area-room-types/page.tsx
"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Plus, Home, Search, Trash2 } from "lucide-react"

type AreaRoomType = {
    id: string
    name: string
    description: string
    createdAt: string
}

export default function AreaRoomTypesPage() {
    const [areaRoomTypes, setAreaRoomTypes] = useState<AreaRoomType[]>([])
    const [loading, setLoading] = useState(false)

    // Create dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [formData, setFormData] = useState({ name: "", description: "" })
    const [searchTerm, setSearchTerm] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Details dialog state
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [selectedType, setSelectedType] = useState<AreaRoomType | null>(null)

    // Edit state inside details
    const [editMode, setEditMode] = useState(false)
    const [editData, setEditData] = useState({ name: "", description: "" })
    const [savingEdit, setSavingEdit] = useState(false)
    const [editError, setEditError] = useState<string | null>(null)

    // Delete state
    const [deleting, setDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    // Fetch list
    const fetchAreaRoomTypes = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch("/api/area-room-types")
            if (!res.ok) throw new Error("Failed to fetch area/room types")
            const json = await res.json()
            setAreaRoomTypes(
                (json?.data ?? []).map((item: any) => ({
                    id: item._id ?? item.id,
                    name: item.name,
                    description: item.description ?? "",
                    createdAt: item.createdAt ?? "",
                }))
            )
        } catch (e: any) {
            setError(e?.message ?? "Error loading area/room types")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAreaRoomTypes()
    }, [])

    // Create
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name.trim() || isSubmitting) return
        setIsSubmitting(true)
        setError(null)
        try {
            const res = await fetch("/api/area-room-types", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description || undefined,
                }),
            })
            if (!res.ok) {
                const maybe = await res.json().catch(() => null)
                throw new Error(maybe?.error || "Create failed")
            }
            await fetchAreaRoomTypes()
            setFormData({ name: "", description: "" })
            setIsDialogOpen(false)
        } catch (e: any) {
            setError(e?.message ?? "Something went wrong")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Filtered list
    const filteredTypes = useMemo(
        () =>
            areaRoomTypes.filter(
                (t) =>
                    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    t.description.toLowerCase().includes(searchTerm.toLowerCase())
            ),
        [areaRoomTypes, searchTerm]
    )

    // Open details
    const openDetails = useCallback((type: AreaRoomType) => {
        setSelectedType(type)
        setEditMode(false)
        setEditError(null)
        setDeleteError(null)
        setEditData({ name: type.name, description: type.description ?? "" })
        setDetailsOpen(true)
    }, [])

    const onCardKeyDown = useCallback(
        (e: React.KeyboardEvent, type: AreaRoomType) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                openDetails(type)
            }
        },
        [openDetails]
    )

    const formatDateTime = (value?: string) => {
        if (!value) return "-"
        const d = new Date(value)
        return isNaN(d.getTime()) ? "-" : d.toLocaleString()
    }

    // Save edits
    const saveEdit = async () => {
        if (!selectedType) return
        if (!editData.name.trim()) {
            setEditError("Name is required")
            return
        }
        setSavingEdit(true)
        setEditError(null)

        // optimistic update
        const prev = [...areaRoomTypes]
        const idx = prev.findIndex((x) => x.id === selectedType.id)
        if (idx >= 0) {
            const updated: AreaRoomType = {
                ...prev[idx],
                name: editData.name,
                description: editData.description ?? "",
            }
            const optimistic = [...prev]
            optimistic[idx] = updated
            setAreaRoomTypes(optimistic)
            setSelectedType(updated)
        }

        try {
            const res = await fetch(`/api/area-room-types/${selectedType.id}`, {
                method: "PATCH", // change to "PUT" if your route expects it
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editData.name,
                    description: editData.description || null,
                }),
            })
            if (!res.ok) {
                const maybe = await res.json().catch(() => null)
                throw new Error(maybe?.error || "Update failed")
            }
            setEditMode(false)
        } catch (e: any) {
            setEditError(e?.message ?? "Failed to save changes")
            await fetchAreaRoomTypes()
        } finally {
            setSavingEdit(false)
        }
    }

    // Delete
    const deleteType = async () => {
        if (!selectedType || deleting) return
        setDeleteError(null)

        // optional confirmation (keeps UX simple without nesting dialogs)
        const ok = window.confirm(`Delete "${selectedType.name}"? This action cannot be undone.`)
        if (!ok) return

        setDeleting(true)

        // optimistic removal
        const prev = [...areaRoomTypes]
        setAreaRoomTypes(prev.filter((x) => x.id !== selectedType.id))

        try {
            // Preferred REST style:
            const res = await fetch(`/api/area-room-types/${selectedType.id}`, {
                method: "DELETE",
            })

            // If your API instead expects query param:
            // const res = await fetch(`/api/area-room-types?id=${selectedType.id}`, { method: "DELETE" })

            if (!res.ok) {
                const maybe = await res.json().catch(() => null)
                throw new Error(maybe?.error || "Delete failed")
            }

            // close dialog on success
            setDetailsOpen(false)
            setSelectedType(null)
        } catch (e: any) {
            // rollback on error
            setDeleteError(e?.message ?? "Failed to delete")
            await fetchAreaRoomTypes()
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

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[oklch(35.04%_0.01007_216.95)]">Area/Room Types</h1>
                        <p className="text-[oklch(44.226%_0.00005_271.152)]  font-semibold">Manage different area and room types for your projects</p>
                    </div>

                    {/* Create New Type Dialog */}
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-[oklch(32.988%_0.05618_196.615)] text-white hover:bg-[oklch(32.988%_0.05618_196.615)]/90">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Area/Room Type
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add New Area/Room Type</DialogTitle>
                                <DialogDescription>Create a new area or room type for your projects.</DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleSubmit}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Enter area/room type name"
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Enter description"
                                            rows={6}
                                            className="h-32 max-h-56 overflow-y-auto resize-none"
                                        />
                                    </div>

                                    {error && <p className="text-sm text-red-500">{error}</p>}
                                </div>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsDialogOpen(false)}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? "Saving…" : "Save"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search area/room types..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className=" bg-[oklch(98%_0.01_220)]/80">
                        <CardHeader className="flex flex-row  items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-bold">Total Types</CardTitle>
                            <Home className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{areaRoomTypes.length}</div>
                        </CardContent>
                    </Card>
                    <Card className=" bg-[oklch(98%_0.01_220)]/80">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-bold">Recently Added</CardTitle>
                            <Plus className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {
                                    areaRoomTypes.filter((t) => {
                                        const weekAgo = new Date()
                                        weekAgo.setDate(weekAgo.getDate() - 7)
                                        return new Date(t.createdAt) > weekAgo
                                    }).length
                                }
                            </div>
                        </CardContent>
                    </Card>
                    <Card className=" bg-[oklch(98%_0.01_220)]/80">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-bold">Search Results</CardTitle>
                            <Search className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{filteredTypes.length}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* List */}
                {loading ? (
                    <div className="py-8 text-center text-muted-foreground">Loading…</div>
                ) : error ? (
                    <div className="py-8 text-center text-red-500">{error}</div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredTypes.map((type) => (
                            <Card
                                key={type.id}
                                className="hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                                onClick={() => openDetails(type)}
                                onKeyDown={(e) => onCardKeyDown(e, type)}
                                role="button"
                                tabIndex={0}
                                aria-label={`View details for ${type.name}`}
                            >
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Home className="h-5 w-5 text-primary " />
                                        {type.name}
                                    </CardTitle>
                                    <CardDescription>Created: {new Date(type.createdAt).toLocaleDateString()}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-3">{type.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {filteredTypes.length === 0 && !loading && !error && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Home className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No area/room types found</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                {searchTerm ? "No types match your search criteria." : "Get started by adding your first area/room type."}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Details Dialog (+ Edit + Delete) */}
                <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                    <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editMode ? `Edit: ${selectedType?.name ?? ""}` : selectedType?.name ?? "Details"}
                            </DialogTitle>
                            <DialogDescription>
                                {editMode ? "Update the fields and save your changes." : "Complete information for this area/room type."}
                            </DialogDescription>
                        </DialogHeader>

                        {!editMode ? (
                            <div className="grid gap-4">
                                <div className="grid gap-1">
                                    <Label className="text-xs text-muted-foreground">Name</Label>
                                    <p className="text-base font-medium">{selectedType?.name ?? "-"}</p>
                                </div>

                                <div className="grid gap-1">
                                    <Label className="text-xs text-muted-foreground">Description</Label>
                                    <div className="max-h-[35vh] overflow-y-auto rounded-md border p-3 bg-muted/30">
                                        <p className="text-sm whitespace-pre-wrap break-words">
                                            {selectedType?.description?.trim() ? selectedType.description : "—"}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-1">
                                    <Label className="text-xs text-muted-foreground">Created At</Label>
                                    <p className="text-sm">{formatDateTime(selectedType?.createdAt)}</p>
                                </div>

                                {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-name">Name</Label>
                                    <Input
                                        id="edit-name"
                                        value={editData.name}
                                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                        placeholder="Enter name"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-description">Description</Label>
                                    <Textarea
                                        id="edit-description"
                                        value={editData.description}
                                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                        placeholder="Enter description"
                                        rows={6}
                                        className="h-32 max-h-56 overflow-y-auto resize-none"
                                    />
                                </div>
                                {editError && <p className="text-sm text-red-500">{editError}</p>}
                            </div>
                        )}

                        <DialogFooter className="gap-2 sm:gap-2">
                            {!editMode ? (
                                <>
                                    <Button variant="outline" onClick={closeDetails}>Close</Button>
                                    <Button onClick={() => setEditMode(true)}>Edit</Button>
                                    <Button
                                        variant="destructive"
                                        onClick={deleteType}
                                        disabled={deleting || !selectedType}
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
                                            setEditData({
                                                name: selectedType?.name ?? "",
                                                description: selectedType?.description ?? "",
                                            })
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
