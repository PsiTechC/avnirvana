import { NextResponse } from "next/server";

export function ok(data: unknown, status = 200) {
    return NextResponse.json({ data }, { status });
}
export function badRequest(error: unknown) {
    return NextResponse.json({ error }, { status: 400 });
}
export function notFound(msg = "Not found") {
    return NextResponse.json({ error: msg }, { status: 404 });
}
