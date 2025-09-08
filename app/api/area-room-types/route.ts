
// app/api/area-room-types/route.ts
import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb";
import AreaRoomType from "@/models/AreaRoomType"
import { z } from "zod"


// If you already have this in "@/lib/zod", import it instead.
// import { AreaRoomTypeSchema } from "@/lib/zod"
const AreaRoomTypeSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
})

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/area-room-types — list (newest first)
export async function GET() {
    try {
        await dbConnect()
        const items = await AreaRoomType.find().sort({ createdAt: -1 })
        return NextResponse.json({ ok: true, data: items }, { status: 200 })
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message ?? "Failed to fetch" }, { status: 500 })
    }
}

// POST /api/area-room-types — create
export async function POST(req: NextRequest) {
    try {
        const raw = await req.json()
        const parsed = AreaRoomTypeSchema.parse(raw)

        await dbConnect()
        const created = await AreaRoomType.create(parsed)

        return NextResponse.json({ ok: true, data: created }, { status: 201 })
    } catch (err: any) {
        const message = err?.errors?.[0]?.message ?? err?.message ?? "Failed to create"
        return NextResponse.json({ ok: false, error: message }, { status: 400 })
    }
}
