import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export function requireAuth(req: NextRequest): { username: string } | null {
  // Check for JWT in cookie
  const cookie = req.cookies.get("token")?.value;
  if (cookie) {
    try {
      const payload = jwt.verify(cookie, JWT_SECRET) as { username: string };
      return payload;
    } catch {
      return null;
    }
  }
  // Check for JWT in Authorization header
  const auth = req.headers.get("authorization");
  if (auth && auth.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { username: string };
      return payload;
    } catch {
      return null;
    }
  }
  return null;
}
