// app/api/brands/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import path from "path";
import { uploadBufferToR2 } from "@/lib/r2helper";
import { requireAuth } from "@/lib/auth";

// IMPORTANT: ensure Node.js runtime (required for file ops)
export const runtime = "nodejs";
// Always show latest list
export const dynamic = "force-dynamic";

// ---- Project imports ----
import { dbConnect } from "@/lib/mongodb";
import Brand from "@/models/Brand";
import Product from "@/models/Product";

// Zod schema (unchanged)
const CreateBrandSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    websiteUrl: z.string().optional(),
    status: z.enum(["active", "inactive"]),
    logoUrl: z.string().optional(),
});

// ---- Helpers (minimal, local) ----
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

/** brands/<brandSlug>/brand-logo.<ext> */
function brandLogoKey(brandName: string, file: { type?: string; name?: string }) {
    const brandSlug = slugify(brandName);
    const ext = extFromMimeOrName(file.type, file.name);
    return `brands/${brandSlug}/brand-logo${ext}`;
}

// GET /api/brands — return a list of brands (unchanged)
export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (!auth) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();
        let brands = await Brand.find().sort({ createdAt: -1 }).lean();
        brands = brands.filter((b) => b._id && b._id !== "");

        const brandIds = brands.map((b) => b._id);
        const counts = await Product.aggregate([
            { $match: { brandId: { $in: brandIds } } },
            { $group: { _id: "$brandId", count: { $sum: 1 } } },
        ]);
        const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

        const data = brands.map((b) => ({
            ...b,
            productsCount: countMap[String(b._id)] || 0,
        }));

        return NextResponse.json({ ok: true, data }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json(
            { ok: false, error: err?.message ?? "Failed to fetch brands" },
            { status: 500 }
        );
    }
}

// POST /api/brands — create a brand (multipart/form-data)
export async function POST(req: NextRequest) {
    const auth = requireAuth(req);
    if (!auth) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const form = await req.formData();

        const name = (form.get("name") as string | null)?.trim() ?? "";
        const descriptionRaw = (form.get("description") as string | null)?.trim() ?? "";
        const websiteUrlRaw = (form.get("websiteUrl") as string | null)?.trim() ?? "";
        const statusRaw = (form.get("status") as string | null)?.trim() ?? "active";
        const logo = form.get("logo") as File | null;

        // Normalize optional fields
        const description = descriptionRaw || undefined;
        const websiteUrl = websiteUrlRaw || undefined;

        // Validate/guard file types & size (unchanged)
        let logoUrl: string | undefined;
        if (logo) {
            const validTypes = ["image/png", "image/jpeg", "image/webp"];
            if (!validTypes.includes(logo.type)) {
                return NextResponse.json(
                    { ok: false, error: "Invalid logo file type" },
                    { status: 400 }
                );
            }
            const MAX_BYTES = 2 * 1024 * 1024; // 2MB
            if ((logo as any).size > MAX_BYTES) {
                return NextResponse.json(
                    { ok: false, error: "Logo too large (max 2MB)" },
                    { status: 400 }
                );
            }

            // ---- R2 upload (replaces local save) ----
            const key = brandLogoKey(name, { type: logo.type, name: logo.name });
            const buffer = Buffer.from(await logo.arrayBuffer());
            // uploadBufferToR2 should return { url, key } — we store url to keep existing schema
            const { url } = await uploadBufferToR2({
                buffer,
                key,
                contentType: logo.type,
                // For public buckets, default cache is fine.
                // For private buckets, you can adjust uploadBufferToR2 to set private cache and
                // serve via a proxy/signed URL; existing schema expects a URL.
            });
            logoUrl = url; // keep existing field name & behavior
        }

        // Validate payload (unchanged)
        const parsed = CreateBrandSchema.parse({
            name,
            description,
            websiteUrl,
            status: statusRaw === "inactive" ? "inactive" : "active",
            logoUrl,
        });

        await dbConnect();

        const created = await Brand.create(parsed);
        return NextResponse.json({ ok: true, data: created }, { status: 201 });
    } catch (err: any) {
        const message = err?.errors?.[0]?.message ?? err?.message ?? "Failed to create brand";
        return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
}
