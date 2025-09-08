import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import Client from "@/models/Client"
import { requireAuth } from "@/lib/auth"

export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (!auth) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect()
    const clients = await Client.find().sort({ createdAt: -1 }).lean()
    return NextResponse.json({ ok: true, data: clients }, { status: 200 })
}

export async function POST(req: NextRequest) {
    const auth = requireAuth(req);
    if (!auth) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect()
    const body = await req.json()
    const created = await Client.create(body)
    return NextResponse.json({ ok: true, data: created }, { status: 201 })
}
