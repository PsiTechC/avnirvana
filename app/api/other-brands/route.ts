// app/api/other-brands/route.ts
import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb";
import OtherBrand from "@/models/OtherBrand"
import { z } from "zod"
import { OtherBrandSchema } from "@/lib/zod"
import { requireAuth } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/other-brands — list all other brands (newest first)
 */
export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (!auth) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect()
        const items = await OtherBrand.find().sort({ createdAt: -1 })
        return NextResponse.json({ ok: true, data: items }, { status: 200 })
    } catch (err: any) {
        return NextResponse.json(
            { ok: false, error: err?.message ?? "Failed to fetch other brands" },
            { status: 500 }
        )
    }
}


export async function POST(req: NextRequest) {
    const auth = requireAuth(req);
    if (!auth) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const raw = await req.json()
        const parsed = OtherBrandSchema.parse(raw)

        await dbConnect()
        const created = await OtherBrand.create(parsed)

        return NextResponse.json({ ok: true, data: created }, { status: 201 })
    } catch (err: any) {
        // If it's a ZodError, surface first message; else generic
        const message =
            err?.errors?.[0]?.message ??
            err?.message ??
            "Failed to create other brand"
        return NextResponse.json({ ok: false, error: message }, { status: 400 })
    }
}
