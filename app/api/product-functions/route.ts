// Copied from product-function/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import ProductFunction from "@/models/ProductFunction";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";

const ProductFunctionSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (!auth) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();
        let items = await ProductFunction.find().sort({ createdAt: -1 });
        items = items.filter(i => i._id && i._id !== "");
        return NextResponse.json({ ok: true, data: items }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message ?? "Failed to fetch" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = requireAuth(req);
    if (!auth) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

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
