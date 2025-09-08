"use client";

import type React from "react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Removed Dialog imports
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Network, Plus, Search } from "lucide-react";

type ProductFunctionUI = {
    id: string;
    name: string;
    description: string;
    createdAt: string; // ISO string
};

export default function ProductsFunctionsPage() {
    const router = useRouter();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [formData, setFormData] = useState({ name: "", description: "" });

    const [functions, setFunctions] = useState<ProductFunctionUI[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Details dialog state
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFn, setSelectedFn] = useState<ProductFunctionUI | null>(null);

    // Edit mode inside details dialog
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({ name: "", description: "" });
    const [savingEdit, setSavingEdit] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    // Delete state
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Initial load from API
    const fetchFunctions = async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const res = await fetch("/api/product-function", { cache: "no-store" });
            if (res.status === 401) {
                router.replace("/login");
                return;
            }
            if (!res.ok) throw new Error("Failed to load functions");
            const json = await res.json();
            const list: ProductFunctionUI[] = (json?.data ?? []).map((d: any) => ({
                id: d._id ?? d.id,
                name: d.name,
                description: d.description ?? "",
                createdAt: d.createdAt,
            }));
            setFunctions(list);
        } catch (e: any) {
            setLoadError(e?.message ?? "Failed to load");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFunctions();
    }, []);

    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return functions.filter(
            (f) =>
                f.name.toLowerCase().includes(q) ||
                (f.description ?? "").toLowerCase().includes(q)
        );
    }, [functions, searchQuery]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!formData.name.trim() || formData.name.trim().length < 2) {
            setSubmitError("Name must be at least 2 characters.");
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const res = await fetch("/api/product-function", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    description: formData.description.trim() || undefined,
                }),
            });

            if (!res.ok) {
                const maybe = await res.json().catch(() => null);
                throw new Error(maybe?.error || "Create failed");
            }

            const { data } = await res.json();

            const created: ProductFunctionUI = {
                id: data._id ?? data.id,
                name: data.name,
                description: data.description ?? "",
                createdAt: data.createdAt,
            };

            // Optimistic UI update
            setFunctions((prev) => [created, ...prev]);

            // Reset + close
            setFormData({ name: "", description: "" });
            setIsDialogOpen(false);
        } catch (err: any) {
            setSubmitError(err?.message ?? "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Open details dialog on card click (prefill edit state too)
    const openDetails = useCallback((fn: ProductFunctionUI) => {
        setSelectedFn(fn);
        setEditMode(false);
        setEditError(null);
        setDeleteError(null);
        setEditData({ name: fn.name, description: fn.description ?? "" });
        setDetailsOpen(true);
    }, []);

    const onCardKeyDown = useCallback(
        (e: React.KeyboardEvent, fn: ProductFunctionUI) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openDetails(fn);
            }
        },
        [openDetails]
    );

    const formatDateTime = (value?: string) => {
        if (!value) return "-";
        const d = new Date(value);
        return isNaN(d.getTime()) ? "-" : d.toLocaleString();
    };

    // Save edit
    const saveEdit = async () => {
        if (!selectedFn) return;
        if (!editData.name.trim()) {
            setEditError("Name is required");
            return;
        }

        setSavingEdit(true);
        setEditError(null);

        // optimistic update
        const prev = [...functions];
        const idx = prev.findIndex((x) => x.id === selectedFn.id);
        let rollback: ProductFunctionUI | null = null;

        if (idx >= 0) {
            rollback = prev[idx];
            const updated: ProductFunctionUI = {
                ...prev[idx],
                name: editData.name,
                description: editData.description ?? "",
            };
            const optimistic = [...prev];
            optimistic[idx] = updated;
            setFunctions(optimistic);
            setSelectedFn(updated);
        }

        try {
            const res = await fetch(`/api/product-function/${selectedFn.id}`, {
                method: "PATCH", // change to "PUT" if your route expects it
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editData.name,
                    description: editData.description || null,
                }),
            });

            if (!res.ok) {
                const maybe = await res.json().catch(() => null);
                throw new Error(maybe?.error || "Update failed");
            }

            setEditMode(false);
        } catch (err: any) {
            setEditError(err?.message ?? "Failed to save changes");
            // rollback
            if (rollback) {
                setFunctions((prevList) =>
                    prevList.map((x) => (x.id === rollback!.id ? rollback! : x))
                );
                setSelectedFn(rollback);
            }
            // ensure server truth next time
            await fetchFunctions();
        } finally {
            setSavingEdit(false);
        }
    };

    // Delete
    const handleDelete = async () => {
        if (!selectedFn) return;
        if (!confirm(`Delete "${selectedFn.name}"? This cannot be undone.`)) return;

        setDeleting(true);
        setDeleteError(null);

        try {
            const res = await fetch(`/api/product-function/${selectedFn.id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const maybe = await res.json().catch(() => null);
                throw new Error(maybe?.error || "Failed to delete");
            }

            // Optimistically remove from UI
            setFunctions((prev) => prev.filter((f) => f.id !== selectedFn.id));
            setSelectedFn(null);
            setDetailsOpen(false);
        } catch (e: any) {
            setDeleteError(e?.message ?? "Delete failed");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[oklch(35.04%_0.01007_216.95)]">Products Functions</h1>
                        <p className="text-[oklch(44.226%_0.00005_271.152)]  font-semibold">
                            Manage product features, capabilities, and technical specifications
                        </p>
                    </div>

                    <Button
                        className="bg-[oklch(32.988%_0.05618_196.615)] text-white hover:bg-[oklch(32.988%_0.05618_196.615)]/90"
                        onClick={() => router.push("/product_functions/add")}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Function
                    </Button>
                </div>

                {/* Search */}
                <div className="flex items-center space-x-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 font-bold text-muted-foreground\\" />
                        <Input
                            placeholder="Search functions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>

                {/* Status cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="border-border bg-[oklch(98%_0.01_220)]/80">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-bold text-[oklch(0%_0_0)]">Total Functions</CardTitle>
                            <Network className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{functions.length}</div>
                            <p className="text-xs text-[oklch(18.338%_0.00163_16.6)]">In your catalog</p>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-[oklch(98%_0.01_220)]/80">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-bold text-[oklch(0%_0_0)]">Recently Added</CardTitle>
                            <Network className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {functions.filter((f) => {
                                    const weekAgo = new Date();
                                    weekAgo.setDate(weekAgo.getDate() - 7);
                                    return new Date(f.createdAt) > weekAgo;
                                }).length}
                            </div>
                            <p className="text-xs text-[oklch(18.338%_0.00163_16.6)]">Last 7 days</p>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-[oklch(98%_0.01_220)]/80">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-bold text-[oklch(0%_0_0)]">Search Results</CardTitle>
                            <Search className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{filtered.length}</div>
                            <p className="text-xs text-[oklch(18.338%_0.00163_16.6)]">Matching your query</p>
                        </CardContent>
                    </Card>
                </div>

                {/* List */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {isLoading && (
                        <Card>
                            <CardContent className="py-10 text-center text-[oklch(0%_0_0)]">Loading functions…</CardContent>
                        </Card>
                    )}

                    {loadError && !isLoading && (
                        <Card>
                            <CardContent className="py-10 text-center text-red-500">{loadError}</CardContent>
                        </Card>
                    )}

                    {!isLoading && !loadError && filtered.length === 0 && (
                        <Card>
                            <CardContent className="py-10 text-center text-[oklch(0%_0_0)]">
                                {searchQuery ? "No functions match your search." : "No functions yet. Add your first one!"}
                            </CardContent>
                        </Card>
                    )}

                    {!isLoading &&
                        !loadError &&
                        filtered.map((fn) => (
                            <Card
                                key={fn.id}
                                className="border-border  bg-[oklch(98%_0.01_220)]/80 hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                                onClick={() => router.push(`/product_functions/${fn.id}`)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        router.push(`/product_functions/${fn.id}`);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                                aria-label={`View details for ${fn.name}`}
                            >
                                <CardHeader>
                                    <CardTitle className="text-base text-[oklch(0%_0_0)]">{fn.name}</CardTitle>
                                    <CardDescription>Created: {new Date(fn.createdAt).toLocaleDateString()}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-[oklch(0%_0_0)] line-clamp-3">{fn.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                </div>

                {/* Removed Floating details dialog with edit + delete */}
            </div>
        </DashboardLayout>
    );
}
