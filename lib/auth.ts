import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export function requireAuth(req: NextRequest): { username: string } | null {
  // No authentication, always allow
  return { username: "guest" };
}
