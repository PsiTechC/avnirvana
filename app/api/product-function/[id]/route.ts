

import { dbConnect } from "@/lib/mongodb";
import ProductFunction from "@/models/ProductFunction";
import { z } from "zod";
import { ok, badRequest, notFound } from "@/lib/api-helper";
import { isObjectId } from "@/lib/ids";

// GET /api/product-function/:id
export async function GET(_req: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    if (!isObjectId(params.id)) return notFound();

    const doc = await ProductFunction.findById(params.id).lean();
    if (!doc) return notFound();
    return ok(doc);
}

//PATCH /api/product-function/:id
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    if (!isObjectId(params.id)) return notFound();

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return badRequest({ message: "Invalid JSON body" });
    }

    // Local update schema: allow only these fields, both optional.
    // (Avoids picking keys that don't exist on ProductFunctionSchema.)
    const UpdateSchema = z
        .object({
            name: z.string().min(2).optional(),
            description: z.string().optional(),
        })
        .strict();

    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.format());

    // Remove undefined to prevent overwriting with undefined
    const update = Object.fromEntries(
        Object.entries(parsed.data).filter(([, v]) => v !== undefined)
    );

    const updated = await ProductFunction.findByIdAndUpdate(params.id, update, {
        new: true,
        runValidators: true,
    }).lean();

    if (!updated) return notFound();
    return ok(updated);
}

// DELETE /api/product-function/:id
// export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
//     await dbConnect();
//     if (!isObjectId(params.id)) return notFound();

//     const deleted = await ProductFunction.findByIdAndDelete(params.id).lean();
//     if (!deleted) return notFound();
//     return ok({ ok: true });
// }

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    if (!isObjectId(params.id)) return notFound();
    const deleted = await ProductFunction.findByIdAndDelete(params.id).lean();
    if (!deleted) return notFound();
    return ok({ ok: true });
}