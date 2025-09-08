// app/(dashboard)/product-categories/page.tsx
"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Network, Plus, Search, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"

type ProductCategoryUI = {
    id: string
    name: string
    description?: string
    createdAt: string
}

export default function ProductCategoriesPage() {
    const router = useRouter();
    // List & load
    const [categories, setCategories] = useState<ProductCategoryUI[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)

    // Search
    const [searchQuery, setSearchQuery] = useState("")

    // Remove dialog state for add

    // Details/Edit dialog
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [selected, setSelected] = useState<ProductCategoryUI | null>(null)
    const [editMode, setEditMode] = useState(false)
    const [editData, setEditData] = useState({ name: "", description: "" })
    const [savingEdit, setSavingEdit] = useState(false)
    const [editError, setEditError] = useState<string | null>(null)

    // Delete
    const [deleting, setDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    // --- Load categories (uses your existing GET /api/product-categories) ---
    const fetchCategories = useCallback(async () => {
        setIsLoading(true)
        setLoadError(null)
        try {
            const res = await fetch("/api/product-categories", { cache: "no-store" }) // present in your current page:contentReference[oaicite:2]{index=2}
            if (!res.ok) throw new Error("Failed to load categories")
            const { data } = await res.json()
            setCategories(
                (data ?? []).map((cat: any) => ({
                    id: cat._id ?? cat.id,
                    name: cat.name,
                    description: cat.description ?? "",
                    createdAt: cat.createdAt ?? "",
                }))
            )
        } catch (e: any) {
            setLoadError(e?.message ?? "Failed to load")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        let alive = true;
        (async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
                const res = await fetch("/api/product-categories", { cache: "no-store", credentials: "include" });
                if (res.status === 401) {
                    router.replace("/login");
                    return;
                }
                if (!res.ok) throw new Error("Failed to load product categories");
                const json = await res.json();
                const list = (json?.data ?? []).map((c: any) => ({
                    id: c.id ?? c._id,
                    name: c.name,
                    status: c.status ?? "",
                    createdAt: c.createdAt ?? "",
                }));
                if (alive) setCategories(list);
            } catch (e: any) {
                if (alive) setLoadError(e?.message ?? "Failed to load");
            } finally {
                if (alive) setIsLoading(false);
            }
        })();
        return () => { alive = false; };
    }, []);


    // --- Filtered list ---
    const filtered = useMemo(
        () =>
            categories.filter(
                (c) =>
                    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (c.description ?? "").toLowerCase().includes(searchQuery.toLowerCase())
            ),
        [categories, searchQuery]
    )

    // --- Delete category from card ---
    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this category?")) return;
        setDeleting(true);
        setDeleteError(null);
        try {
            const res = await fetch(`/api/product-categories/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const maybe = await res.json().catch(() => null);
                throw new Error(maybe?.error || "Delete failed");
            }
            setCategories(prev => prev.filter(c => c.id !== id));
        } catch (e: any) {
            setDeleteError(e?.message ?? "Failed to delete");
        } finally {
            setDeleting(false);
        }
    };

    const formatDateTime = (value?: string) => {
        if (!value) return "-"
        const d = new Date(value)
        return isNaN(d.getTime()) ? "-" : d.toLocaleString()
    }

    // --- Save edit (PATCH /api/product-categories/:id) ---
    const saveEdit = async () => {
        if (!selected) return
        if (!editData.name.trim()) {
            setEditError("Name is required")
            return
        }
        setSavingEdit(true)
        setEditError(null)

        // optimistic update
        const prev = [...categories]
        const idx = prev.findIndex((x) => x.id === selected.id)
        if (idx >= 0) {
            const updated: ProductCategoryUI = {
                ...prev[idx],
                name: editData.name.trim(),
                description: editData.description ?? "",
            }
            const optimistic = [...prev]
            optimistic[idx] = updated
            setCategories(optimistic)
            setSelected(updated)
        }

        try {
            const res = await fetch(`/api/product-categories/${selected.id}`, {
                method: "PATCH", // switch to "PUT" if your route expects it
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editData.name.trim(),
                    description: editData.description || null,
                }),
            })
            // If your API expects query param instead:
            // const res = await fetch(`/api/product-categories?id=${selected.id}`, { method: "PATCH", headers: {"Content-Type": "application/json"}, body: JSON.stringify({...}) })
            if (!res.ok) {
                const maybe = await res.json().catch(() => null)
                throw new Error(maybe?.error || "Update failed")
            }
            setEditMode(false)
        } catch (e: any) {
            setEditError(e?.message ?? "Failed to save changes")
            await fetchCategories()
        } finally {
            setSavingEdit(false)
        }
    }

    // --- Delete (DELETE /api/product-categories/:id) ---
    const deleteCategory = async () => {
        if (!selected || deleting) return
        const ok = window.confirm(`Delete "${selected.name}"? This action cannot be undone.`)
        if (!ok) return

        setDeleting(true)
        setDeleteError(null)

        // optimistic removal
        const prev = [...categories]
        setCategories(prev.filter((x) => x.id !== selected.id))

        try {
            const res = await fetch(`/api/product-categories/${selected.id}`, {
                method: "DELETE",
            })
            // If your API expects query param instead:
            // const res = await fetch(`/api/product-categories?id=${selected.id}`, { method: "DELETE" })
            if (!res.ok) {
                const maybe = await res.json().catch(() => null)
                throw new Error(maybe?.error || "Delete failed")
            }
            setDetailsOpen(false)
            setSelected(null)
        } catch (e: any) {
            setDeleteError(e?.message ?? "Failed to delete")
            await fetchCategories()
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
                {/* Header + Create */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[oklch(35.04%_0.01007_216.95)]">Product Categories</h1>
                        <p className="text-[oklch(44.226%_0.00005_271.152)]  font-semibold">Manage types of categories of products.</p>
                    </div>
                    <Button className="bg-[oklch(32.988%_0.05618_196.615)] text-white hover:bg-[oklch(32.988%_0.05618_196.615)]/90" onClick={() => router.push("/product_categories/add")}> 
                        <Plus className="mr-2 h-4 w-4" />
                        Add Category
                    </Button>
                </div>

                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-[oklch(18.338%_0.00163_16.6)]" />
                    <Input
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>

                {/* List */}
                {isLoading ? (
                    <div className="text-center text-[oklch(57.951%_0.00007_271.152)] py-8">Loading...</div>
                ) : loadError ? (
                    <div className="text-center text-red-500 py-8">{loadError}</div>
                ) : filtered.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <h3 className="text-lg font-semibold mb-2">No categories found</h3>
                                    <p className="text-[oklch(44.226%_0.00005_271.152)] font-semibold  text-center mb-4">
                                {searchQuery ? "No categories match your search criteria." : "Get started by adding your first product category."}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((cat) => (
                            <Card key={cat.id} className="border-border  bg-[oklch(98%_0.01_220)]/80 hover:shadow-md transition-shadow">
                                <Link href={`/product_categories/${cat.id}`} passHref legacyBehavior>
                                    <a className="block focus:outline-none" tabIndex={0} aria-label={`Open ${cat.name}`}> 
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm  font-bold text-[oklch(0%_0_0)] font-medium">{cat.name}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-base text-[oklch(57.951%_0.00007_271.152)] font-semibold mb-2 line-clamp-3">{cat.description}</div>
                                            <div className="text-xs font-bold text-[oklch(0%_0_0)]">Created: {new Date(cat.createdAt).toLocaleDateString()}</div>
                                        </CardContent>
                                    </a>
                                </Link>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Details/Edit/Delete dialog removed. Use subpages for add/edit. */}
            </div>
        </DashboardLayout>
    )
}
