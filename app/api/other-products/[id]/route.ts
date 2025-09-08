import { NextRequest } from "next/server"
import { ok, badRequest, notFound } from "@/lib/api-helper"
import { dbConnect } from "@/lib/mongodb"
import OtherProduct from "@/models/OtherProduct"
import { z } from "zod"

// validate ObjectId-ish
const isId = (s: string) => /^[0-9a-fA-F]{24}$/.test(s)

// shared validators
const Base = z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    specification: z.string().max(10000).optional(),
    price: z.number().nonnegative().optional(),
    status: z.enum(["active", "inactive"]).optional(),
    categoryIds: z.array(z.string()).optional(),
    functionIds: z.array(z.string()).optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
    await dbConnect()
    if (!isId(params.id)) return notFound()
    const doc = await OtherProduct.findById(params.id).lean()
    if (!doc) return notFound()
    return ok(doc)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    await dbConnect()
    if (!isId(params.id)) return notFound()
    const raw = await req.json().catch(() => ({}))

    // normalize
    const body = Object.fromEntries(
        Object.entries(raw).map(([k, v]) => [k, v === null ? undefined : v])
    )

    const parsed = Base.partial().safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.format())

    const data: any = { ...parsed.data }
    if ("categoryIds" in data) data.categoryIds = (data.categoryIds ?? []).filter(Boolean)
    if ("functionIds" in data) data.functionIds = (data.functionIds ?? []).filter(Boolean)

    const updated = await OtherProduct.findByIdAndUpdate(params.id, data, { new: true }).lean()
    if (!updated) return notFound()
    return ok(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
    await dbConnect()
    if (!isId(params.id)) return notFound()
    const deleted = await OtherProduct.findByIdAndDelete(params.id).lean()
    if (!deleted) return notFound()
    return ok({ ok: true })
}
