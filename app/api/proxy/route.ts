import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });

  // Server-side fetch → no browser CORS restrictions
  const upstream = await fetch(url, { cache: "no-store" });
  if (!upstream.ok) {
    return new NextResponse("Upstream error", { status: upstream.status });
  }

  const ct = upstream.headers.get("content-type") ?? "application/octet-stream";
  const buf = await upstream.arrayBuffer();

  return new NextResponse(buf, {
    headers: {
      "Content-Type": ct,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
