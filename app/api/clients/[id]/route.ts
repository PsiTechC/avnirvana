import { dbConnect } from "@/lib/mongodb";
import Client from "@/models/Client";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  await dbConnect();
  try {
    const client = await Client.findById(params.id).lean();
    if (!client) {
      return NextResponse.json({ ok: false, error: "Client not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: client }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Invalid client id" }, { status: 400 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  await dbConnect();
  try {
    const body = await req.json();
    const updated = await Client.findByIdAndUpdate(params.id, { $set: body }, { new: true, runValidators: true }).lean();
    if (!updated) {
      return NextResponse.json({ ok: false, error: "Client not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: updated }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Invalid client id or body" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await dbConnect();
  try {
    const deleted = await Client.findByIdAndDelete(params.id).lean();
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "Client not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: deleted }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Invalid client id" }, { status: 400 });
  }
}
