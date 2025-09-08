export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    await dbConnect();
    const ProductOrder = (await import("@/models/ProductOrder")).default;
    const orderDoc = await ProductOrder.findOne({ brandId: id });
    if (!orderDoc) {
      return NextResponse.json({ ok: true, data: { productOrder: [] } }, { status: 200 });
    }
    return NextResponse.json({ ok: true, data: { productOrder: orderDoc.productOrder } }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Failed to fetch product order" }, { status: 400 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Brand from "@/models/Brand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    const body = await req.json();
    if (!Array.isArray(body.productOrder)) {
      return NextResponse.json({ ok: false, error: "productOrder must be an array of product IDs" }, { status: 400 });
    }
    await dbConnect();
    // Save product order in ProductOrder model
    const ProductOrder = (await import("@/models/ProductOrder")).default;
    const updated = await ProductOrder.findOneAndUpdate(
      { brandId: id },
      { $set: { productOrder: body.productOrder } },
      { new: true, upsert: true, runValidators: true }
    );
    if (!updated) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, data: updated }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Failed to update product order" }, { status: 400 });
  }
}
