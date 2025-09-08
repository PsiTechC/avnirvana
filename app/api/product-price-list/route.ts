// app/api/product-price-list/route.ts
import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import PriceChange from "@/models/PriceChange" // create this model as shown below

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const productId = searchParams.get("productId")
        if (!productId) return NextResponse.json({ ok: false, error: "productId required" }, { status: 400 })

        await dbConnect()
        const rows = await PriceChange.find({ productId }).sort({ effectiveFrom: -1, createdAt: -1 }).lean()
        return NextResponse.json({ ok: true, data: rows })
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e?.message ?? "Failed" }, { status: 500 })
    }
}
