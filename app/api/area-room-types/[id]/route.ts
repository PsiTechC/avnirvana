
import { dbConnect } from "@/lib/mongodb"
import AreaRoomType from "@/models/AreaRoomType"
import { AreaRoomTypeSchema } from "@/lib/zod"
import { ok, badRequest, notFound } from "@/lib/api-helper"
import { isObjectId } from "@/lib/ids"

// GET /api/area-room-types/:id
export async function GET(_req: Request, { params }: { params: { id: string } }) {
    await dbConnect()
    if (!isObjectId(params.id)) return notFound()

    const doc = await AreaRoomType.findById(params.id).lean()
    if (!doc) return notFound()
    return ok(doc)
}

// PATCH /api/area-room-types/:id
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    await dbConnect()
    if (!isObjectId(params.id)) return notFound()

    let body: unknown
    try {
        body = await req.json()
    } catch {
        return badRequest({ message: "Invalid JSON body" })
    }

    // Allow partial updates: { name?, description? }
    const parsed = AreaRoomTypeSchema.partial().safeParse(body)
    if (!parsed.success) {
        return badRequest(parsed.error.format())
    }

    const updated = await AreaRoomType.findByIdAndUpdate(
        params.id,
        parsed.data,
        {
            new: true,           // return updated doc
            runValidators: true, // enforce schema validators on update
            lean: true,
        }
    )

    if (!updated) return notFound()
    return ok(updated)
}

// DELETE /api/area-room-types/:id
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    await dbConnect()
    if (!isObjectId(params.id)) return notFound()

    const deleted = await AreaRoomType.findByIdAndDelete(params.id).lean()
    if (!deleted) return notFound()
    return ok({ ok: true })
}
