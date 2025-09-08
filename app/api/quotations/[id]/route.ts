import { dbConnect } from "@/lib/mongodb";
import Quotation from "@/models/Quotation";
import { ok, notFound } from "@/lib/api-helper";
import { isObjectId } from "@/lib/ids";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    if (!isObjectId(params.id)) return notFound();
    const doc = await Quotation.findById(params.id).lean();
    if (!doc) return notFound();
    return ok(doc);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    if (!isObjectId(params.id)) return notFound();
    const doc = await Quotation.findByIdAndDelete(params.id).lean();
    if (!doc) return notFound();
    return ok({ ok: true });
}

// PUT handler to update a quotation by ID
export async function PUT(req: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    if (!isObjectId(params.id)) return notFound();
    const body = await req.json();
    const doc = await Quotation.findByIdAndUpdate(
        params.id,
        { $set: body },
        { new: true, runValidators: true }
    ).lean();
    if (!doc) return notFound();
    return ok(doc);
}
