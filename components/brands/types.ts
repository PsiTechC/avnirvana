// components/brands/types.ts
export type BrandUI = {
    id: string
    name: string
    description?: string
    logoUrl?: string
    websiteUrl?: string
    status: "active" | "inactive"
    productsCount?: number
    createdAt: string
}
