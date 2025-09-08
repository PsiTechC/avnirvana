
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Category = {
    _id?: string;
    id?: string;
    name?: string;
    description?: string;
    createdAt?: string;
};

export default function CategoryDetailPage() {
    const { id } = useParams<{ id: string }>() ?? {};
    const router = useRouter();
    const [category, setCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const categoryId = useMemo(
        () => category?._id || category?.id,
        [category]
    );

    useEffect(() => {
        if (!id) return;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/product-categories/${id}`);
                if (!res.ok) throw new Error("Failed to load category");
                const { data } = await res.json();
                setCategory(data);
            } catch (e: any) {
                setError(e?.message ?? "Failed to load");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const handleDelete = async () => {
        if (!categoryId) return;
        if (!window.confirm("Are you sure you want to delete this category?")) return;
        try {
            const res = await fetch(`/api/product-categories/${categoryId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Delete failed");
            router.replace("/product_categories");
        } catch {
            alert("Failed to delete category.");
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="p-6 text-muted-foreground">Loading…</div>
            </DashboardLayout>
        );
    }

    if (error || !category) {
        return (
            <DashboardLayout>
                <div className="p-6 text-red-500">{error || "Category not found"}</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto p-6 sm:p-8">
                {/* Top bar: Back on the left, actions on the right */}
                <div className="flex items-center justify-between gap-3 mb-6">
                    <Button variant="outline" onClick={() => router.push("/product_categories")}>
                        Back
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="default"
                            onClick={() => router.push(`/product_categories/${categoryId}/edit`)}
                            disabled={!categoryId}
                        >
                            Edit
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={!categoryId}>
                            Delete
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl sm:text-3xl">{category.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-6">
                            <span className="font-semibold">Description:</span>
                            <div className="mt-2 p-3 rounded bg-muted/30 max-h-64 min-h-[12rem] overflow-y-auto whitespace-pre-wrap">
                                {category.description || "—"}
                            </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Created: {category.createdAt ? new Date(category.createdAt).toLocaleString() : "—"}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
