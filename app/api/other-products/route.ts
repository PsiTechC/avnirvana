

import { NextRequest, NextResponse } from "next/server"
import { ok, badRequest } from "@/lib/api-helper"
import { dbConnect } from "@/lib/mongodb"
import OtherProduct from "@/models/OtherProduct"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"

// allow arrays for categories/functions and the new "specification" field
const Payload = z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    specification: z.string().max(10000).optional(),               // NEW
    price: z.number().nonnegative().optional(),
    status: z.enum(["active", "inactive"]).default("active"),
    categoryIds: z.array(z.string()).optional(),                   // NEW
    functionIds: z.array(z.string()).optional(),                   // NEW
})

export async function GET(req: NextRequest) {
    const auth = requireAuth(req)
    if (!auth) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const q = req.nextUrl.searchParams.get("q")?.trim()

    const filter: any = {}
    if (q) {
        // search across name / sku / description / specification
        filter.$or = [
            { name: { $regex: q, $options: "i" } },
            { description: { $regex: q, $options: "i" } },
            { specification: { $regex: q, $options: "i" } },
        ]
    }

    const docs = await OtherProduct.find(filter).sort({ createdAt: -1 }).lean()
    return ok(docs)
}

export async function POST(req: NextRequest) {
    const auth = requireAuth(req)
    if (!auth) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const json = await req.json().catch(() => ({}))
    const parsed = Payload.safeParse(json)
    if (!parsed.success) return badRequest(parsed.error.format())

    // Normalize empty arrays
    const data = {
        ...parsed.data,
        categoryIds: parsed.data.categoryIds?.filter(Boolean) ?? [],
        functionIds: parsed.data.functionIds?.filter(Boolean) ?? [],
    }

    const created = await OtherProduct.create(data)
    return ok(created, 201)
}
