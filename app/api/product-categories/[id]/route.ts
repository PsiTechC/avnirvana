

// app/api/product-categories/[id]/route.ts
import { dbConnect } from "@/lib/mongodb"
import ProductCategory from "@/models/ProductCategory"
import { ProductCategorySchema } from "@/lib/zod"
import { ok, badRequest, notFound } from "@/lib/api-helper"
import { isObjectId } from "@/lib/ids"

// GET /api/product-categories/:id
export async function GET(_req: Request, { params }: { params: { id: string } }) {
    try {
        await dbConnect()
        const { id } = params
        if (!isObjectId(id)) return notFound()

        const doc = await ProductCategory.findById(id).lean()
        if (!doc) return notFound()

        return ok(doc)
    } catch (err) {
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 })
    }
}

// PATCH /api/product-categories/:id
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        await dbConnect()
        const { id } = params
        if (!isObjectId(id)) return notFound()

        const body = await req.json().catch(() => null)
        if (!body || typeof body !== "object") {
            return badRequest({ message: "Invalid JSON body" })
        }

        // Allow partial updates; only accept fields from the schema
        const parsed = ProductCategorySchema.partial().safeParse(body)
        if (!parsed.success) {
            return badRequest(parsed.error.format())
        }

        const updated = await ProductCategory.findByIdAndUpdate(id, parsed.data, { new: true }).lean()
        if (!updated) return notFound()

        return ok(updated)
    } catch (err) {
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 })
    }
}

// DELETE /api/product-categories/:id
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    try {
        await dbConnect()
        const { id } = params
        if (!isObjectId(id)) return notFound()

        const deleted = await ProductCategory.findByIdAndDelete(id).lean()
        if (!deleted) return notFound()

        return ok({ ok: true })
    } catch (err) {
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 })
    }
}
