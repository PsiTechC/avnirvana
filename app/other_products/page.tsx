// app/(dashboard)/other-products/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type CategoryOpt = { id: string; name: string }
type FunctionOpt = { id: string; name: string }

type OtherProduct = {
    _id: string
    name: string
    description?: string
    specification?: string
    categoryIds?: string[]
    functionIds?: string[]
    price?: number
    status: "active" | "inactive"
    createdAt?: string
}

export default function OtherProductsPage() {
    const router = useRouter()

    // ---------- Data sources (lists + options) ----------
    const [items, setItems] = useState<OtherProduct[]>([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)

    const [categories, setCategories] = useState<CategoryOpt[]>([])
    const [functions, setFunctions] = useState<FunctionOpt[]>([])
    const [catLoading, setCatLoading] = useState(false)
    const [fnLoading, setFnLoading] = useState(false)
    const [catError, setCatError] = useState<string | null>(null)
    const [fnError, setFnError] = useState<string | null>(null)

    // ---------- Search ----------
    const [query, setQuery] = useState("")
    const [searching, setSearching] = useState(false)

    // ---------- Helpers ----------
    const categoryNames = (ids?: string[]) =>
        (ids ?? [])
            .map((id) => categories.find((c) => c.id === id)?.name)
            .filter(Boolean)
            .join(", ") || "—"

    const functionNames = (ids?: string[]) =>
        (ids ?? [])
            .map((id) => functions.find((f) => f.id === id)?.name)
            .filter(Boolean)
            .join(", ") || "—"

    // ---------- Loaders ----------
    const loadList = async (q = "") => {
        setLoading(true)
        setLoadError(null)
        try {
            const url = q.trim()
                ? `/api/other-products?q=${encodeURIComponent(q.trim())}`
                : "/api/other-products"
            const res = await fetch(url, { cache: "no-store" })
            if (!res.ok) throw new Error("Failed to fetch other products")
            const { data } = await res.json()
            setItems(data || [])
        } catch (e: any) {
            setLoadError(e?.message ?? "Failed to load products")
        } finally {
            setLoading(false)
        }
    }

    const loadCategories = async () => {
        setCatLoading(true)
        setCatError(null)
        try {
            const res = await fetch("/api/product-categories", { cache: "no-store" })
            if (!res.ok) throw new Error("Failed to load categories")
            const json = await res.json()
            const opts: CategoryOpt[] = (json?.data ?? []).map((c: any) => ({
                id: c._id ?? c.id,
                name: c.name,
            }))
            setCategories(opts)
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
            const opts: FunctionOpt[] = (json?.data ?? []).map((f: any) => ({
                id: f._id ?? f.id,
                name: f.name,
            }))
            setFunctions(opts)
        } catch (e: any) {
            setFnError(e?.message ?? "Could not load functions")
        } finally {
            setFnLoading(false)
        }
    }

    // ---------- Init: load list + options so IDs can map to names on cards ----------
    useEffect(() => {
        loadList()
        loadCategories()
        loadFunctions()
    }, [])

    // ---------- Search ----------
    const doSearch = async () => {
        setSearching(true)
        await loadList(query)
        setSearching(false)
    }

    // ---------- Derived ----------
    const activeCount = useMemo(() => items.filter((i) => i.status === "active").length, [items])
    const inactiveCount = useMemo(
        () => items.filter((i) => i.status === "inactive").length,
        [items],
    )

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-6 p-6">
                {/* Header (Add navigates to subpage) */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight  text-[oklch(35.04%_0.01007_216.95)]">Other Products</h1>
                        <p className="text-[oklch(44.226%_0.00005_271.152)] font-semibold">
                            Manage accessories, spare parts, and complementary products
                        </p>
                    </div>

                    <Button asChild className="bg-[oklch(32.988%_0.05618_196.615)] text-white hover:bg-[oklch(32.988%_0.05618_196.615)]/90">
                        <Link href="/other_products/add">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Other Product
                        </Link>
                    </Button>
                </div>

                {/* Search bar + button (unchanged) */}
                <div className="flex items-center gap-2 max-w-xl">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 border-black/30 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search products by name, description, specification…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-10"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") doSearch()
                            }}
                        />
                    </div>
                    <Button className="bg-[oklch(32.988%_0.05618_196.615)] text-white" onClick={doSearch} disabled={searching}>
                        {searching ? "Searching…" : "Search"}
                    </Button>
                </div>

                {/* Status cards (unchanged) */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="border-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold">Active</CardTitle>
                            <CardDescription>Currently available</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-muted-foreground">Loading…</div>
                            ) : (
                                <div className="text-2xl font-bold">{activeCount}</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold">Inactive</CardTitle>
                            <CardDescription>Temporarily unavailable</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-muted-foreground">Loading…</div>
                            ) : (
                                <div className="text-2xl font-bold">{inactiveCount}</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* List (cards navigate to details subpage) */}
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle className="font-bold">Other Products</CardTitle>
                        <CardDescription>Latest items from the catalog</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadError && <div className="text-red-500">{loadError}</div>}
                        {!loadError &&
                            (loading ? (
                                <div className="text-black">Loading…</div>
                            ) : items.length === 0 ? (
                                <div className="text-muted-foreground">No other products found.</div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {items.map((p) => (
                                        <Link key={p._id} href={`/other_products/${p._id}`} className="block">
                                            <Card className="border-border hover:shadow-md transition cursor-pointer w-[320px] h-[260px] mx-auto">
                                                <CardHeader className="pb-2">
                                                    <div className="flex items-center justify-between">
                                                        <CardTitle className="text-sm font-bold">{p.name}</CardTitle>
                                                        <span
                                                            className={`text-xs px-2 py-0.5 rounded ${p.status === "active"
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-gray-200 text-gray-800"
                                                            }`}
                                                        >
                                                            {p.status}
                                                        </span>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-2">
                                                    {p.description && (
                                                        <p className="text-sm text-muted-foreground line-clamp-3">{p.description}</p>
                                                    )}
                                                    {p.specification && (
                                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                                            <span className="text-black font-bold">Spec: </span>
                                                            {p.specification}
                                                        </p>
                                                    )}
                                                    <div className="text-sm">
                                                        <span className="text-black font-bold">Categories: </span>
                                                        <span>{categoryNames(p.categoryIds)}</span>
                                                    </div>
                                                    <div className="text-sm">
                                                        <span className="text-black font-bold">Functions: </span>
                                                        <span>{functionNames(p.functionIds)}</span>
                                                    </div>
                                                    {typeof p.price === "number" && (
                                                        <div className="text-sm">
                                                            <span className="text-black font-bold">Price: </span>
                                                            <span>₹ {p.price.toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            ))}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
