// components/products/product-grid.tsx
"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { ProductCard } from "./product-card"
import { EditProductDialog } from "./edit-product-dialog";
import { DeleteProductDialog } from "./delete-product-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation";


type ProductUI = {
  id: string
  name: string
  description: string
  specification: string  
  brand: string | null
  brandId: string
  category: string | null
  categoryId: string
  function: string | null
  functionId: string
  price: number
  isPOR: boolean
  imageUrl?: string
  images?: string[] // <-- Add this line
  //sku: string
  status: "active" | "inactive"
  //stockLevel: number
  createdAt: string
}

interface ProductGridProps {
  brandFilter: string
  categoryFilter: string
  functionFilter: string
  searchQuery: string
  sortBy: "name" | "brand" | "category" | "price"
  sortOrder: "asc" | "desc"
}

/** Safely get an id string from various API shapes (string | {_id} | {id} | null) */
function asId(v: any): string {
  if (!v) return ""
  if (typeof v === "string") return v
  if (typeof v === "object") return v._id || v.id || ""
  return ""
}
// add near asId()
const asName = (v: any): string | null =>
  typeof v === "string" ? v : (v?.name ?? null)


export function ProductGrid({
  brandFilter,
  categoryFilter,
  functionFilter,
  searchQuery,
  sortBy,
  sortOrder,
}: ProductGridProps) {
  const [products, setProducts] = useState<ProductUI[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingProduct, setEditingProduct] = useState<ProductUI | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<ProductUI | null>(null)

  // Quick View
  const [selectedProduct, setSelectedProduct] = useState<ProductUI | null>(null)
  const [quickOpen, setQuickOpen] = useState(false)
  const router = useRouter()
  useEffect(() => {
    let alive = true;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load products");
        const json = await res.json();

        const list: ProductUI[] = (json?.data ?? []).map((p: any) => {
          const brandId = asId(p.brandId ?? p.brand_id);
          // categoryIds and functionIds are arrays of strings
          const categoryIds = Array.isArray(p.categoryIds) ? p.categoryIds.map(asId) : [];
          const functionIds = Array.isArray(p.functionIds) ? p.functionIds.map(asId) : [];
          const brandName = asName(p.brand) ?? asName(p.brandId);
          // For display, use first category/function name if available
          const categoryName = Array.isArray(p.categories) && p.categories.length > 0 ? p.categories[0] : null;
          const functionName = Array.isArray(p.functions) && p.functions.length > 0 ? p.functions[0] : null;
          const imageUrl = p.mainImage || (Array.isArray(p.images) && p.images[0]) || p.imageUrl || "";
          const images = Array.isArray(p.images) ? p.images : (p.imageUrl ? [p.imageUrl] : []);
          return {
            id: p.id ?? p._id,
            name: p.name,
            description: p.description ?? "",
            specification: p.specification ?? "",
            brand: brandName,
            brandId,
            category: categoryName,
            categoryId: categoryIds,
            function: functionName,
            functionId: functionIds,
            price: typeof p.price === "number" ? p.price : Number(p.price ?? 0),
            isPOR: !!p.isPOR,
            imageUrl,
            images,
            status: p.status === "inactive" ? "inactive" : "active",
            createdAt: p.createdAt ?? new Date().toISOString(),
          };
        });

        if (alive) setProducts(list);
      } catch (e: any) {
        if (alive) setError(e?.message ?? "Failed to load");
      } finally {
        if (alive) setIsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const matchesBrand = brandFilter === "all" || product.brandId === brandFilter;
      const categoryIds: string[] = Array.isArray(product.categoryId) ? product.categoryId : [];
      const functionIds: string[] = Array.isArray(product.functionId) ? product.functionId : [];
      const matchesCategory = categoryFilter === "all" || categoryIds.includes(categoryFilter);
      const matchesFunction = functionFilter === "all" || functionIds.includes(functionFilter);
      const matchesSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.specification.toLowerCase().includes(q);
      return matchesBrand && matchesCategory && matchesFunction && matchesSearch;
    });

    const sorted = [...filtered].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "brand":
          aValue = a.brand ?? "";
          bValue = b.brand ?? "";
          break;
        case "category":
          aValue = a.category ?? "";
          bValue = b.category ?? "";
          break;
        case "price":
          aValue = a.isPOR ? 0 : a.price;
          bValue = b.isPOR ? 0 : b.price;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return sortOrder === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return sorted;
  }, [products, brandFilter, categoryFilter, functionFilter, searchQuery, sortBy, sortOrder]);

  const handleEdit = (updated: any) => {
    const updatedUI: ProductUI = {
      id: updated.id,
      name: updated.name,
      description: updated.description ?? "",
      specification: updated.specification ?? "",
      brand: updated.brand ?? updated.brandId?.name ?? null,
      brandId: asId(updated.brandId ?? updated.brand_id),
      category: updated.category ?? updated.categoryId?.name ?? null,
      categoryId: asId(updated.categoryId ?? updated.category_id),
      function: updated.function ?? updated.functionId?.name ?? null,
      functionId: asId(updated.functionId ?? updated.function_id),
      price: typeof updated.price === "number" ? updated.price : Number(updated.price ?? 0),
      isPOR: !!updated.isPOR,
      imageUrl: updated.imageUrl,
      //sku: updated.sku ?? "",
      status: updated.status === "inactive" ? "inactive" : "active",
      //stockLevel:
       // typeof updated.stockLevel === "number" ? updated.stockLevel : Number(updated.stockLevel ?? 0),
      createdAt: updated.createdAt ?? new Date().toISOString(),
    }
    setProducts((prev) => prev.map((p) => (p.id === updatedUI.id ? updatedUI : p)))
    setEditingProduct(null)
    setSelectedProduct((prev) => (prev && prev.id === updatedUI.id ? updatedUI : prev))
  }

  const handleDelete = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      setProducts((prev) => prev.filter((p) => p.id !== productId))
      setDeletingProduct(null)
      if (selectedProduct?.id === productId) {
        setQuickOpen(false)
        setSelectedProduct(null)
      }
    } catch (err) {
      // Optionally show error toast/UI
      setDeletingProduct(null)
    }
  }

  if (isLoading) {
    return <div className="text-center py-12"><div className="text-muted-foreground">Loading products…</div></div>
  }

  if (error) {
    return <div className="text-center py-12"><div className="text-red-500">{error}</div></div>
  }

  if (filteredAndSortedProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          {searchQuery ? "No products found matching your search criteria." : "No products found."}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredAndSortedProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={{
              ...product,
              brand: product.brand ?? "",
              category: product.category ?? "",
              function: product.function ?? "",
              imageUrl: product.imageUrl ?? "",

              
            }}
           
            onOpenDetails={() => { setSelectedProduct(product); setQuickOpen(true) }}
            onEdit={() => router.push(`/products/${product.id}/edit`)}
            onDelete={() => setDeletingProduct(product)}
          />
        ))}
      </div>

      {/* Quick View dialog */}
      <ProductQuickViewDialog
        open={quickOpen}
        onOpenChange={setQuickOpen}
        product={selectedProduct}
        onEdit={() => selectedProduct && setEditingProduct(selectedProduct)}
        onDelete={() => selectedProduct && setDeletingProduct(selectedProduct)}
      />

      {/* Edit / Delete dialogs */}
      <EditProductDialog
        product={editingProduct ? {
          ...editingProduct,
          brand: editingProduct.brand ?? "",
          category: editingProduct.category ?? "",
          function: editingProduct.function ?? "",
          imageUrl: editingProduct.imageUrl ?? "",
        } : null}
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
        onSave={handleEdit}
      />

      <DeleteProductDialog
        product={deletingProduct ? {
          ...deletingProduct,
          brand: deletingProduct.brand ?? "",
          category: deletingProduct.category ?? "",
          function: deletingProduct.function ?? "",
          imageUrl: deletingProduct.imageUrl ?? "",
        } : null}
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        onConfirm={() => deletingProduct && handleDelete(deletingProduct.id)}
      />
    </>
  )
}

/* ---------- Quick View (unchanged) ---------- */

function ProductQuickViewDialog({
  open,
  onOpenChange,
  product,
  onEdit,
  onDelete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: ProductUI | null
  onEdit: () => void
  onDelete: () => void
}) {
  if (!product) return null

  const router = useRouter()

  // Show all images as a gallery in the dialog (smaller size)
  const images: string[] = product?.images || (product?.imageUrl ? [product.imageUrl] : []);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center justify-between">
            <span>{product.name}</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">{product.status}</Badge>
              {product.isPOR ? (
                <Badge variant="secondary">POR</Badge>
              ) : (
                <Badge variant="secondary">Rs {product.price.toFixed(2)}</Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-2">
            <div className="flex gap-2 flex-wrap">
              {images.length > 0 ? (
                images.map((img, idx) => (
                  <div key={idx} className="relative h-20 w-20 rounded-lg overflow-hidden border bg-muted/20">
                    <Image
                      src={img}
                      alt={product.name + " image " + (idx + 1)}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                ))
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                  No image
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-3 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Brand" value={product.brand || "—"} />
              <Detail label="Category" value={product.category || "—"} />
              <Detail label="Function" value={product.function || "—"} />
              {/* <Detail label="SKU" value={product.sku || "—"} /> */}
              {/* <Detail label="Stock" value={String(product.stockLevel ?? "—")}/> */}
              <Detail label="Added" value={new Date(product.createdAt).toLocaleDateString()} />
            </div>

            {(product.description ?? "").trim() && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Description:</div>
                <div className="max-h-32 overflow-y-auto rounded bg-white/10 p-2">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
              </div>
            )}

            {(product.specification ?? "").trim() && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Specification</div>
                <div className="max-h-32 overflow-y-auto rounded bg-white/10 p-2">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {product.specification}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => router.push(`/products/${product.id}/edit`)}
                className="bg-accent hover:bg-accent/90"
              >
                Edit
              </Button>
              <Button variant="destructive" onClick={onDelete}>Delete</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-foreground">{value}</div>
    </div>
  )
}
