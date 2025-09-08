import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import ProductCategory from "@/models/ProductCategory"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ProductCategorySchema = z.object({
    name: z.string().min(2, "Category name must be at least 2 characters").max(100),
    description: z.string().max(500).optional(),
})

// GET /api/product-categories — list newest first
export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (!auth) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect()
    let items = await ProductCategory.find().sort({ createdAt: -1 })
    // Filter out categories with empty or missing _id
    items = items.filter(i => i._id && i._id !== "")
    return NextResponse.json({ ok: true, data: items }, { status: 200 })
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message ?? "Failed to fetch" }, { status: 500 })
    }
}

// POST /api/product-categories — create
export async function POST(req: NextRequest) {
    const auth = requireAuth(req);
    if (!auth) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const raw = await req.json()
        const parsed = ProductCategorySchema.parse(raw)

        await dbConnect()
        const created = await ProductCategory.create(parsed)
        return NextResponse.json({ ok: true, data: created }, { status: 201 })
    } catch (err: any) {
        if (err?.code === 11000) {
            return NextResponse.json({ ok: false, error: "Category name already exists" }, { status: 409 })
        }
        const message = err?.errors?.[0]?.message ?? err?.message ?? "Failed to create"
        return NextResponse.json({ ok: false, error: message }, { status: 400 })
    }
}
