
// app/api/other-brands/[id]/route.ts

import { dbConnect } from "@/lib/mongodb"
import OtherBrand from "@/models/OtherBrand"
import { OtherBrandSchema } from "@/lib/zod"
import { ok, badRequest, notFound } from "@/lib/api-helper"
import { isObjectId } from "@/lib/ids"

// GET /api/other-brands/:id
export async function GET(_req: Request, { params }: { params: { id: string } }) {
    try {
        await dbConnect()
        if (!isObjectId(params.id)) return notFound()

        const doc = await OtherBrand.findById(params.id).lean()
        if (!doc) return notFound()

        return ok(doc)
    } catch (err) {
        return badRequest("Failed to fetch brand")
    }
}

// PATCH /api/other-brands/:id
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        await dbConnect()
        if (!isObjectId(params.id)) return notFound()

        const body = await req.json()
        const parsed = OtherBrandSchema.partial().safeParse(body)
        if (!parsed.success) {
            return badRequest(parsed.error.format())
        }

        const updated = await OtherBrand.findByIdAndUpdate(params.id, parsed.data, { new: true }).lean()
        if (!updated) return notFound()

        return ok(updated)
    } catch (err) {
        return badRequest("Failed to update brand")
    }
}

// DELETE /api/other-brands/:id
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    try {
        await dbConnect()
        if (!isObjectId(params.id)) return notFound()

        const deleted = await OtherBrand.findByIdAndDelete(params.id).lean()
        if (!deleted) return notFound()

        return ok({ ok: true })
    } catch (err) {
        return badRequest("Failed to delete brand")
    }
}
