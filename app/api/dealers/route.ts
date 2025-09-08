
// app/api/dealers/route.ts
import { NextRequest, NextResponse } from "next/server";
import Dealer from "@/models/Dealer";
import { dbConnect } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- R2 upload helper ---
import { uploadBufferToR2 } from "@/lib/r2helper";
import path from "path";

// Minimal helpers to build the desired key: dealerlogo/<dealer-slug>.<ext>
function slugify(input: string, { max = 80 } = {}) {
    return (input || "unnamed")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase()
        .slice(0, max);
}
function extFromMimeOrName(mime?: string, filename?: string) {
    const fromName = filename ? path.extname(filename) : "";
    if (fromName) return fromName;
    if (mime === "image/png") return ".png";
    if (mime === "image/jpeg") return ".jpg";
    if (mime === "image/webp") return ".webp";
    return ".bin";
}
function dealerLogoKey(dealerName: string, file: { type?: string; name?: string }) {
    const dealerSlug = slugify(dealerName);
    const ext = extFromMimeOrName(file.type, file.name);
    return `dealerlogo/${dealerSlug}${ext}`;
}

// GET /api/dealers — list dealers (newest first)
export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (!auth) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();
        let items = await Dealer.find().sort({ createdAt: -1 });
        // Filter out dealers with empty or missing _id (kept behavior)
        items = items.filter((i: any) => i._id && i._id !== "");
        return NextResponse.json({ ok: true, data: items }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json(
            { ok: false, error: err?.message ?? "Failed to fetch dealers" },
            { status: 500 }
        );
    }
}

// POST /api/dealers — create dealer (multipart/form-data)
export async function POST(req: NextRequest) {
    const auth = requireAuth(req);
    if (!auth) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const form = await req.formData();

        const payload: any = {
            name: (form.get("name") as string | null) ?? "",
            contactPerson: (form.get("contactPerson") as string | null) ?? "",
            email: (form.get("email") as string | null) ?? "",
            phone: (form.get("phone") as string | null) ?? "",
            address: (form.get("address") as string | null) ?? "",
            city: (form.get("city") as string | null) ?? "",
            state: (form.get("state") as string | null) ?? "",
            zipCode: (form.get("zipCode") as string | null) ?? "",
            status: (form.get("status") as string | null) ?? "Active", // "Active" | "Inactive"
            dealerType: (form.get("dealerType") as string | null) ?? "Standard", // "Authorized" | "Premium" | "Standard"
            territory: (form.get("territory") as string | null) ?? "",
        };

        // Optional logo -> now upload to R2 instead of local disk
        const logo = form.get("logo") as File | null;
        if (logo && (logo as any).size > 0) {
            const validTypes = ["image/png", "image/jpeg"];
            if (!validTypes.includes(logo.type)) {
                return NextResponse.json({ ok: false, error: "Invalid logo file type" }, { status: 400 });
            }
            if ((logo as any).size > 2 * 1024 * 1024) {
                return NextResponse.json({ ok: false, error: "Logo too large (max 2MB)" }, { status: 400 });
            }

            const buffer = Buffer.from(await logo.arrayBuffer());
            const key = dealerLogoKey(payload.name || "dealer", { type: logo.type, name: logo.name });
            const { url } = await uploadBufferToR2({
                buffer,
                key,
                contentType: logo.type || "application/octet-stream",
            });

            // Keep existing schema: store URL in logoUrl
            payload.logoUrl = url;
        }

        await dbConnect();
        const created = await Dealer.create(payload);
        return NextResponse.json({ ok: true, data: created }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json(
            { ok: false, error: err?.message ?? "Failed to create dealer" },
            { status: 400 }
        );
    }
}
