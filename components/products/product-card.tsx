
"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
interface ProductCardProps {
  product: {
    id: string
    name: string
    brand: string
    category?: string
    function?: string
    categories?: string[]
    functions?: string[]
    isNewProduct?: boolean
    price: number
    isPOR: boolean
    // legacy:
    imageUrl?: string
    // new fields from API:
    mainImage?: string
    images?: string[]
    status: "active" | "inactive"
  }
  onEdit: () => void
  onDelete: () => void
  onOpenDetails: () => void  // required
}

export function ProductCard({ product, onEdit, onDelete, onOpenDetails }: ProductCardProps) {
  const statusColor =
    product.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"

  // Prefer legacy imageUrl (if present), else mainImage, else first of images
  const imageSrc =
    product.imageUrl ||
    product.mainImage ||
    (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : "")

  // Helper to handle both array and string for categories/functions
  const getDisplay = (val?: string | string[]) => {
    if (!val) return "—"
    if (Array.isArray(val)) return val.length > 0 ? val.join(", ") : "—"
    return val.trim() ? val : "—"
  }
  const formatRs = (n?: number) =>
    typeof n === "number"
      ? `₹ ${new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 0
      }).format(n)}`
      : "—";


  const router = useRouter();
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer flex flex-col items-stretch p-3 max-w-[220px]"
      onClick={() => router.push(`/products/${product.id}`)}
      role="button"
      aria-label={`View details for ${product.name}`}
    >
      <CardHeader className="pb-0 flex flex-col items-center">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={`${product.name} main image`}
            width={90}
            height={90}
            className="rounded-lg object-contain mb-2"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-muted mb-2" />
        )}
        <div className="w-full text-center">
          <h3
            className="font-semibold text-[15px] truncate max-w-full"
            title={product.name}
          >
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground truncate max-w-full">
            <span className="font-medium">{product.brand}</span>
          </p>
        </div>
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
                aria-label="Product actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-2 flex flex-col items-center">
        <div className="flex gap-2 items-center mb-1">
          <Badge className={statusColor + ' text-[11px] px-2 py-1'}>{product.status}</Badge>
          {product.isNewProduct === true && (
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[11px] px-2 py-1">New</Badge>
          )}
        </div>
        <div className="text-sm font-semibold mb-1">
          {product.isPOR ? "POR" : formatRs(product.price)}
        </div>
        <div className="text-xs text-muted-foreground text-center">
          {getDisplay(product.categories)}
        </div>
        <div className="text-xs text-muted-foreground text-center">
          Function: {getDisplay(product.functions)}
        </div>
      </CardContent>
    </Card>
  )
}
