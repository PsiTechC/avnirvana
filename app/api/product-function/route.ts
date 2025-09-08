
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import ProductFunction from "@/models/ProductFunction";
import { z } from "zod";

// If you already have this in "@/lib/zod", import it instead.
const ProductFunctionSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/product-functions — list (newest first)
export async function GET() {
    try {
        await dbConnect();
    let items = await ProductFunction.find().sort({ createdAt: -1 });
    // Filter out functions with empty or missing _id
    items = items.filter(i => i._id && i._id !== "");
    return NextResponse.json({ ok: true, data: items }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message ?? "Failed to fetch" }, { status: 500 });
    }
}

// POST /api/product-functions — create
export async function POST(req: NextRequest) {
    try {
        const raw = await req.json();
        const parsed = ProductFunctionSchema.parse(raw);

        await dbConnect();
        const created = await ProductFunction.create(parsed);

        return NextResponse.json({ ok: true, data: created }, { status: 201 });
    } catch (err: any) {
        const message = err?.errors?.[0]?.message ?? err?.message ?? "Failed to create";
        return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
}
