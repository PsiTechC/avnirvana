
// app/api/quotations/route.ts
import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import Quotation from "@/models/Quotation"

import { requireAuth } from "@/lib/auth"


const TAX_RATE = 0.18 // adjust to your needs

function ok(data: any, status = 200) {
    return NextResponse.json({ ok: true, data }, { status })
}
function badRequest(error: any, status = 400) {
    return NextResponse.json({ ok: false, error }, { status })
}


async function GET(req: any) {
    const auth = requireAuth(req);
    if (!auth) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect()

        // filters (optional): status, dealerId, q
        const { searchParams } = new URL(req.url)
        const status = searchParams.get("status") ?? undefined
        const dealerId = searchParams.get("dealerId") ?? undefined
        const q = searchParams.get("q")?.trim()

        const filter: any = {}
        if (status) filter.status = status
        if (dealerId) filter.dealerId = dealerId
        if (q) {
            filter.$or = [
                { quotationNumber: { $regex: q, $options: "i" } },
                { notes: { $regex: q, $options: "i" } },
            ]
        }

        const data = await Quotation.find(filter)
            .sort({ createdAt: -1 })
            .lean()

        return ok(data)
    } catch (e: any) {
        return badRequest(e?.message ?? "Failed to list quotations", 500)
    }
}


async function POST(req: any) {
    const auth = requireAuth(req);
    if (!auth) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect()

        const body = await req.json().catch(() => null)
        if (!body) return badRequest("Invalid JSON body")

        // No Zod validation: accept and process input directly
        const input = body

        // Compute all items from all areas
        const allItems = (input.areas ?? []).flatMap((area: any) => (area.items ?? []))
        const subtotal = allItems.reduce((s: number, it: any) => s + ((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)), 0)
        const tax = Math.round(subtotal * TAX_RATE * 100) / 100
        const discount = Math.max(0, Number(input.discount ?? 0))
        const total = Math.max(0, subtotal + tax - discount)

        // Add totals to each item
        const areas = (input.areas ?? []).map((area: any) => ({
            ...area,
            items: (area.items ?? []).map((it: any) => ({
                ...it,
                total: (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)
            }))
        }))

        const created = await Quotation.create({
            quotationNumber: input.quotationNumber,
            dealerId: input.dealerId,
            validUntil: input.validUntil,
            areas,
            subtotal,
            tax,
            discount,
            total,
            notes: input.notes,
            contactPerson: input.contactPerson,
            email: input.email,
            phone: input.phone,
            status: input.status ?? "Draft",
            createdDate: new Date(),
        })

        // Fetch the created doc with all nested arrays
        const doc = await Quotation.findById(created._id).lean();
        return ok(doc, 201)
    } catch (e: any) {
        return badRequest(e?.message ?? "Failed to create quotation", 500)
    }
}

export { GET, POST }
