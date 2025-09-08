// components/brands/brand-card.tsx
"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, ExternalLink, Package, Edit, Trash2, Power } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from "next/image"
import type { BrandUI } from "./types"

interface BrandCardProps {
  brand: BrandUI
  onStatusToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

export function BrandCard({ brand, onStatusToggle, onEdit, onDelete }: BrandCardProps) {
  const products = typeof brand.productsCount === "number" ? brand.productsCount : 0
  const created = brand.createdAt ? new Date(brand.createdAt) : new Date()
  const router = useRouter()

  // Card click -> navigate to brand details page
  const goToDetails = () => router.push(`/brands/${brand.id}`)

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={goToDetails}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && goToDetails()}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-36 h-16 bg-white rounded-md flex items-center justify-center overflow-hidden">
              <Image
                src={brand.logoUrl || "/placeholder.svg"}
                alt={`${brand.name} logo`}
                width={144}
                height={64}
                className="object-contain mx-auto my-auto"
                style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', display: 'block' }}
                unoptimized
              />
            </div>
          </div>

          {/* Keep menu actions working without navigating */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()} // prevent card click navigation
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => window.location.href = `/brands/${brand.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Brand
              </DropdownMenuItem>
              <DropdownMenuItem onClick={async () => {
                try {
                  const newStatus = brand.status === "active" ? "inactive" : "active";
                  const res = await fetch(`/api/brands/${brand.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: newStatus })
                  });
                  if (res.ok) {
                    window.location.reload();
                  }
                } catch {}
              }}>
                <Power className="mr-2 h-4 w-4" />
                {brand.status === "active" ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              {brand.websiteUrl && (
                <DropdownMenuItem asChild>
                  <a href={brand.websiteUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Visit Website
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Brand
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent onClick={(e) => e.stopPropagation()}>
        <div>
          <h3 className="font-semibold text-lg text-[oklch(18.338%_0.00163_16.6)]">{brand.name}</h3>
          <Badge variant={brand.status === "active" ? "default" : "secondary"}>{brand.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{brand.description || "—"}</p>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-muted-foreground">
            <Package className="mr-1 h-4 w-4" />
            {products} products
          </div>
          <div className="text-muted-foreground">Added {created.toLocaleDateString()}</div>
        </div>
      </CardContent>
    </Card>
  )
}
