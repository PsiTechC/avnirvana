
// app/(dashboard)/brands/[id]/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Edit2, Trash2, ExternalLink, GripVertical, LayoutGrid, List } from "lucide-react"
// import { EditBrandDialog } from "@/components/brands/edit-brand-dialog"
import { DeleteBrandDialog } from "@/components/brands/delete-brand-dialog"

type Brand = {
    id: string
    name: string
    description?: string
    websiteUrl?: string
    logoUrl?: string
    status: "active" | "inactive"
    productsCount?: number
    createdAt?: string
    productOrder?: string[]
}

type Product = {
    id: string
    name: string
    imageUrl?: string
    price?: number
    isPOR?: boolean  
    status?: string
    createdAt?: string
    categories?: string[]
    functions?: string[]
}

/** -------- Existing Grid Card (works with dnd-kit) -------- */
type SortableProductCardProps = {
    id: string
    product: Product
    onClick: () => void
}
function SortableProductCard({ id, product, onClick }: SortableProductCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id })

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 2 : 1,
        boxShadow: isDragging ? "0 0 0 2px #3b82f6" : undefined,
        background: "#fff",
    }

    const formatRs = (n?: number) =>
        typeof n === "number"
            ? `₹ ${new Intl.NumberFormat("en-IN", {
                maximumFractionDigits: 0
            }).format(n)}`
            : "—";


    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="border rounded-lg p-3 cursor-pointer hover:shadow-md transition"
            onClick={onClick}
            role="button"
            aria-label={`View details for ${product.name}`}
        >
            <div className="font-medium">{product.name}</div>
            <div className="text-xs text-muted-foreground">
                Category: {product.categories?.length ? product.categories.join(", ") : "—"}
            </div>
            <div className="text-xs text-muted-foreground">
                Function: {product.functions?.length ? product.functions.join(", ") : "—"}
            </div>

            {/* {product.isPOR ? (
                <div className="text-sm mt-1 font-semibold">POR</div>
            ) : product.price != null ? (
                <div className="text-sm mt-1">₹ {product.price.toLocaleString()}</div>
            ) : (
                <div className="text-sm mt-1">—</div>
            )} */}

            {product.isPOR ? "POR" : formatRs(product.price)}
            {product.status && (
                <div className="text-xs text-muted-foreground mt-1">{product.status}</div>
            )}
        </div>
    )
}

/** -------- New: List Row item (with a drag handle) -------- */
type SortableProductRowProps = {
    id: string
    product: Product
    index: number
    onClick: () => void
}
function SortableProductRow({ id, product, index, onClick }: SortableProductRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id })

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 2 : 1,
        background: isDragging ? "rgba(59,130,246,0.06)" : undefined,
    }
    const formatRs = (n?: number) =>
        typeof n === "number"
            ? `₹ ${new Intl.NumberFormat("en-IN", {
                maximumFractionDigits: 0
            }).format(n)}`
            : "—";


    return (
        <li
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-3 px-3 py-2 hover:bg-muted/40 transition"
        >
            {/* Drag handle: restricts drag start to this handle */}
            <button
                className="p-1 rounded hover:bg-muted/70 cursor-grab active:cursor-grabbing"
                aria-label={`Drag handle for ${product.name}`}
                {...attributes}
                {...listeners}
                onClick={(e) => e.stopPropagation()}
            >
                <GripVertical className="h-4 w-4" />
            </button>

            {/* Main clickable area to open product */}
            <button
                className="flex-1 grid grid-cols-13 items-center text-left"
                onClick={onClick}
                aria-label={`Open ${product.name}`}
            >
                <div className="col-span-1 text-xs">{index + 1}</div> {/* Sr.No */}
                <div className="col-span-4 truncate font-medium">{product.name}</div>
                <div className="col-span-3 text-xs text-muted-foreground truncate">
                    {product.categories?.length ? product.categories.join(", ") : "—"}
                </div>
                <div className="col-span-2 text-xs text-muted-foreground truncate">
                    {product.functions?.length ? product.functions.join(", ") : "—"}
                </div>

                <div className="col-span-2 text-sm">
                    {product.isPOR ? "POR" : formatRs(product.price)}
                </div>
                <div className="col-span-1 text-xs text-muted-foreground truncate">
                    {product.status ?? "—"}
                </div>
            </button>
        </li>
    )
}

export default function BrandDetailsPage() {
    const params = useParams<{ id: string }>()
    const router = useRouter()
    const brandId = params?.id

    const [brand, setBrand] = useState<Brand | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [products, setProducts] = useState<Product[]>([])
    const [productsLoading, setProductsLoading] = useState(true)
    const [productsOrderChanged, setProductsOrderChanged] = useState(false)
    const [productSearch, setProductSearch] = useState("")
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid") // NEW

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    )

    const handleDragEnd = (event: any) => {
        const { active, over } = event
        if (active.id !== over?.id) {
            setProducts((items) => {
                const oldIndex = items.findIndex((p) => p.id === active.id)
                const newIndex = items.findIndex((p) => p.id === over.id)
                const newItems = arrayMove(items, oldIndex, newIndex)
                setProductsOrderChanged(true)
                return newItems
            })
        }
    }

    const handleSaveOrder = async () => {
        if (!brand || products.length === 0) return
        try {
            const productIds = products.map((p) => p.id)
            const res = await fetch(`/api/brands/${brand.id}/products-order`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productOrder: productIds }),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => null)
                throw new Error(err?.error || "Failed to save order")
            }
            setProductsOrderChanged(false)
        } catch (e) {
            console.error(e)
        }
    }

    // dialogs
    const [editing, setEditing] = useState(false)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        if (!brandId) return
        let alive = true
            ; (async () => {
                setLoading(true)
                setError(null)
                try {
                    const res = await fetch(`/api/brands/${brandId}`, { cache: "no-store" })
                    if (!res.ok) throw new Error("Failed to load brand")
                    const { data } = await res.json()
                    const mapped: Brand = {
                        id: data._id ?? data.id,
                        name: data.name,
                        description: data.description ?? "",
                        websiteUrl: data.websiteUrl ?? "",
                        logoUrl: data.logoUrl ?? "",
                        status: data.status === "inactive" ? "inactive" : "active",
                        productsCount: typeof data.productsCount === "number" ? data.productsCount : 0,
                        createdAt: data.createdAt ?? "",
                        productOrder: Array.isArray(data.productOrder) ? data.productOrder : [],
                    }
                    if (alive) setBrand(mapped)
                } catch (e: any) {
                    if (alive) setError(e?.message ?? "Failed to load brand")
                } finally {
                    if (alive) setLoading(false)
                }
            })()
        return () => { alive = false }
    }, [brandId])

    useEffect(() => {
        if (!brandId) return
        let alive = true
            ; (async () => {
                setProductsLoading(true)
                try {
                    const [brandRes, productsRes, orderRes] = await Promise.all([
                        fetch(`/api/brands/${brandId}`, { cache: "no-store" }),
                        fetch(`/api/products?brandId=${brandId}`, { cache: "no-store" }),
                        fetch(`/api/brands/${brandId}/products-order`, { cache: "no-store" })
                    ])
                    if (!brandRes.ok) throw new Error("Failed to load brand")
                    if (!productsRes.ok) throw new Error("Failed to load products")
                    const brandData = await brandRes.json()
                    const productsData = await productsRes.json()
                    let productOrder: string[] = []
                    if (orderRes.ok) {
                        const orderData = await orderRes.json()
                        productOrder = orderData?.data?.productOrder ?? []
                    }
                    const productsList: Product[] = (productsData.data ?? []).map((p: any) => ({
                        id: p._id ?? p.id,
                        name: p.name,
                        imageUrl: p.imageUrl ?? "",
                        price: typeof p.price === "number" ? p.price : undefined,
                        isPOR: p.isPOR === true,
                        status: p.status ?? "",
                        createdAt: p.createdAt ?? "",
                        categories: Array.isArray(p.categories) ? p.categories : [],
                        functions: Array.isArray(p.functions) ? p.functions : [],
                    }))
                    const missing = productsList.filter(p => !productOrder.includes(p.id))
                    const ordered = productOrder
                        .map(id => productsList.find(p => p.id === id))
                        .filter(Boolean) as Product[]
                    const finalList = [...missing, ...ordered]
                    if (alive) setProducts(finalList)
                } catch {
                    if (alive) setProducts([])
                } finally {
                    if (alive) setProductsLoading(false)
                }
            })()
        return () => { alive = false }
    }, [brandId])

    const created = useMemo(() => (brand?.createdAt ? new Date(brand.createdAt) : null), [brand])

    const handleSaveEdit = async (edited: Brand) => {
        if (!brand) return
        try {
            const res = await fetch(`/api/brands/${brand.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: edited.name,
                    description: edited.description ?? "",
                    websiteUrl: edited.websiteUrl ?? "",
                    status: edited.status,
                }),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => null)
                throw new Error(err?.error || "Update failed")
            }
            const { data } = await res.json()
            setBrand((prev) =>
                prev
                    ? {
                        ...prev,
                        name: data.name ?? edited.name,
                        description: data.description ?? edited.description ?? "",
                        websiteUrl: data.websiteUrl ?? edited.websiteUrl ?? "",
                        status: data.status === "inactive" ? "inactive" : "active",
                        logoUrl: data.logoUrl ?? prev.logoUrl,
                        productsCount:
                            typeof data.productsCount === "number" ? data.productsCount : prev.productsCount,
                        createdAt: data.createdAt ?? prev.createdAt,
                    }
                    : prev
            )
        } catch (e) {
            console.error(e)
        } finally {
            setEditing(false)
        }
    }

    const handleConfirmDelete = async () => {
        if (!brand) return
        try {
            const res = await fetch(`/api/brands/${brand.id}`, { method: "DELETE" })
            if (!res.ok) {
                const err = await res.json().catch(() => null)
                throw new Error(err?.error || "Delete failed")
            }
            router.push("/brands")
        } catch (e) {
            console.error(e)
        } finally {
            setDeleting(false)
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="p-6 text-[oklch(0%_0_0)]">Loading brand…</div>
            </DashboardLayout>
        )
    }

    if (error || !brand) {
        return (
            <DashboardLayout>
                <div className="p-6 text-red-500">{error || "Brand not found"}</div>
            </DashboardLayout>
        )
    }

    const filteredProducts = products.filter(p =>
        productSearch.trim() === "" ||
        p.name.toLowerCase().includes(productSearch.trim().toLowerCase())
    )

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                <Tabs defaultValue="details" className="w-full bg-white/20 backdrop-blur-md rounded-xl">
                    <TabsList className="grid w-full grid-cols-2 bg-[oklch(32.988%_0.05618_196.615)]/10  rounded-lg">
                        <TabsTrigger
                            value="details"
                            className="data-[state=active]:bg-[oklch(32.988%_0.05618_196.615)] data-[state=active]:text-black bg-[oklch(0%_0_0)]/10 text-black hover:bg-[oklch(32.988%_0.05618_196.615)]/70 hover:text-white transition"
                        >
                            Details
                        </TabsTrigger>
                        <TabsTrigger
                            value="products"
                            className="data-[state=active]:bg-[oklch(32.988%_0.05618_196.615)] data-[state=active]:text-black bg-[oklch(0%_0_0)]/10 text-black hover:bg-[oklch(32.988%_0.05618_196.615)]/70 hover:text-white transition"
                        >
                            Products
                        </TabsTrigger>
                    </TabsList>

                    {/* Sub-header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-[oklch(35.04%_0.01007_216.95)]">{brand.name}</h1>
                            <p className="text-sm text-[oklch(44.226%_0.00005_271.152)] font-semibold">
                                {brand.status.toUpperCase()} • {created ? created.toLocaleDateString() : "—"}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="default" onClick={() => router.push(`/brands/${brandId}/edit`)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                            <Button variant="destructive" onClick={() => setDeleting(true)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    </div>

                    {/* DETAILS TAB */}
                    <TabsContent value="details" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-bold">Brand Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-6 md:grid-cols-3">
                                    <div className="md:col-span-2 space-y-4">
                                        <div className="grid gap-1">
                                            <Label className="text-xs font-bold text-[oklch(35.04%_0.01007_216.95)]">Website</Label>
                                            {brand.websiteUrl ? (
                                                <a
                                                    href={brand.websiteUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 underline underline-offset-4"
                                                >
                                                    {brand.websiteUrl}
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            ) : (
                                                <p className="text-sm">—</p>
                                            )}
                                        </div>

                                        <div className="grid gap-1">
                                            <Label className="text-xs font-bold text-[oklch(35.04%_0.01007_216.95)]">Description</Label>
                                            <div className="max-h-[45vh] overflow-y-auto rounded-md border p-3 bg-muted/30">
                                                <p className="text-sm whitespace-pre-wrap break-words">
                                                    {brand.description?.trim() ? brand.description : "—"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid gap-1">
                                            <Label className="text-xs font-bold text-[oklch(35.04%_0.01007_216.95)]">Status</Label>
                                            <p className="text-sm">{brand.status}</p>
                                        </div>
                                    </div>

                                    <aside className="md:col-span-1">
                                        <div className="rounded-lg border bg-muted/20 p-3">
                                            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-md">
                                                <Image
                                                    src={brand.logoUrl || "/placeholder.svg"}
                                                    alt={`${brand.name} logo`}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 33vw"
                                                    className="object-contain"
                                                    priority
                                                />
                                            </div>
                                            <p className="mt-2 text-xs font-bold text-[oklch(35.04%_0.01007_216.95)] text-center">Brand Logo</p>
                                        </div>
                                    </aside>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* PRODUCTS TAB */}
                    <TabsContent value="products" className="mt-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Products under {brand.name}</CardTitle>
                                <div className="flex gap-2 items-center ml-auto">
                                    {/* NEW: Grid/List toggle */}
                                    <div className="flex rounded-md overflow-hidden border">
                                        <button
                                            type="button"
                                            onClick={() => setViewMode("grid")}
                                            className={`px-2 py-1 flex items-center gap-1 text-sm ${viewMode === "grid" ? "bg-muted" : "bg-background"}`}
                                            aria-pressed={viewMode === "grid"}
                                            aria-label="Grid view"
                                            title="Grid view"
                                        >
                                            <LayoutGrid className="h-4 w-4" />
                                            Grid
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setViewMode("list")}
                                            className={`px-2 py-1 flex items-center gap-1 text-sm border-l ${viewMode === "list" ? "bg-muted" : "bg-background"}`}
                                            aria-pressed={viewMode === "list"}
                                            aria-label="List view"
                                            title="List view"
                                        >
                                            <List className="h-4 w-4" />
                                            List
                                        </button>
                                    </div>

                                    <input
                                        type="text"
                                        placeholder="Search product..."
                                        className="border rounded-lg px-2 py-1 text-sm min-w-[160px]"
                                        value={productSearch}
                                        onChange={e => setProductSearch(e.target.value)}
                                    />
                                    <Button
                                        variant="default"
                                        onClick={() => router.push("/products/add")}
                                    >
                                        Add Product
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent>
                                {productsLoading ? (
                                    <div className="text-[oklch(18.338%_0.00163_16.6)]">Loading products…</div>
                                ) : filteredProducts.length === 0 ? (
                                    <div className="text-[oklch(18.338%_0.00163_16.6)]">No products for this brand yet.</div>
                                ) : (
                                    <>
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <SortableContext
                                                items={filteredProducts.map((p) => p.id)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                {viewMode === "grid" ? (
                                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                        {filteredProducts.map((p) => (
                                                            <SortableProductCard
                                                                key={p.id}
                                                                id={p.id}
                                                                product={p}
                                                                onClick={() => router.push(`/products/${p.id}`)}
                                                            />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <ul className="rounded-md border divide-y bg-background">
                                                        {/* Header row */}
                                                        <li className="grid grid-cols-14 text-xs font-medium text-muted-foreground px-3 py-2 bg-muted/40">
                                                            <span className="col-span-2">Sr No.</span>
                                                            <span className="col-span-4">Name</span>
                                                            <span className="col-span-3">Categories</span>
                                                            <span className="col-span-2">Functions</span>
                                                            <span className="col-span-2">Price</span>
                                                            <span className="col-span-1">Status</span>
                                                        </li>
                                                        {filteredProducts.map((p,idx) => (
                                                            <SortableProductRow
                                                                key={p.id}
                                                                id={p.id}
                                                                product={p}
                                                                index={idx}   // 👈 pass index
                                                                onClick={() => router.push(`/products/${p.id}`)}
                                                            />
                                                        ))}
                                                    </ul>
                                                )}
                                            </SortableContext>
                                        </DndContext>

                                        {productsOrderChanged && (
                                            <div className="mt-4 flex justify-end">
                                                <Button variant="default" onClick={handleSaveOrder}>
                                                    Save Order
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            <DeleteBrandDialog
                brand={brand as any}
                open={deleting}
                onOpenChange={setDeleting}
                onConfirm={handleConfirmDelete}
            />
        </DashboardLayout>
    )
}
