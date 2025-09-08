// Copied from product-function/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import ProductFunction from "@/models/ProductFunction";
import { z } from "zod";

const ProductFunctionSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
    await dbConnect();
    const item = await ProductFunction.findById(params.id);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: item });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    await dbConnect();
    const body = await req.json();
    const parsed = ProductFunctionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    const updated = await ProductFunction.findByIdAndUpdate(params.id, parsed.data, { new: true });
    return NextResponse.json({ data: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
    await dbConnect();
    await ProductFunction.findByIdAndDelete(params.id);
    return NextResponse.json({ ok: true });
}
