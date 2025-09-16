import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

const USER = {
  username: process.env.NEXT_PUBLIC_ADMIN_USER ,
  password: process.env.NEXT_PUBLIC_ADMIN_PASS ,
};

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (username === USER.username && password === USER.password) {
    // Issue JWT
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1d" });
    // Return token in response body
    return NextResponse.json({ ok: true, token }, { status: 200 });
  }
  return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
}
