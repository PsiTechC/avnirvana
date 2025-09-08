import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import Company from "@/models/Company"

export async function GET() {
  await dbConnect()
  const company = await Company.findOne().lean()
  return NextResponse.json({ ok: true, data: company }, { status: 200 })
}

export async function POST(req: NextRequest) {
  await dbConnect()
  const body = await req.json()
  // Upsert: create if not exists, update if exists
  const company = await Company.findOneAndUpdate({}, body, { upsert: true, new: true, setDefaultsOnInsert: true })
  return NextResponse.json({ ok: true, data: company }, { status: 201 })
}
