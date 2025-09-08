// app/api/quotation-templates/[id]/route.ts (GET one, PUT update, DELETE)
import { NextResponse } from "next/server";
import QuotationTemplate from "@/models/QuotationTemplate";
import { dbConnect } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    const item = await QuotationTemplate.findById(params.id).lean();
    if (!item || Array.isArray(item)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // Defensive: ensure all nested fields are plain objects
    const template = {
        ...item,
        aboutUs: typeof item.aboutUs === "object" && item.aboutUs !== null ? item.aboutUs : {},
        proposalNote: typeof item.proposalNote === "object" && item.proposalNote !== null ? item.proposalNote : {},
        closingNote: typeof item.closingNote === "object" && item.closingNote !== null ? item.closingNote : {},
        cover: typeof item.cover === "object" && item.cover !== null ? item.cover : {},
    };
    if (template._id && typeof template._id !== "string") template._id = template._id.toString();
    return NextResponse.json({ data: template });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    const body = await req.json();
    const updated = await QuotationTemplate.findByIdAndUpdate(params.id, body, { new: true });
    return NextResponse.json({ data: updated });
}

export async function DELETE(req: Request, context: { params: { id: string } }) {
    await dbConnect();
    await QuotationTemplate.findByIdAndDelete(context.params.id);
    return NextResponse.json({ ok: true });
}

