
// app/api/products/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { randomUUID } from "crypto";
import path from "path";

// ---- R2 helper (replaces local fs writes) ----
import { uploadBufferToR2 } from "@/lib/r2helper";

// expect only IDs now
const ProductCreateSchema = z.object({
    name: z.string().trim().min(2),
    description: z.string().trim().optional(),
    specification: z.string().trim().optional(),
    brandId: z.string().trim().refine((v) => isValidObjectId(v), "Invalid brand id"),
    categoryIds: z
        .array(z.string().trim().refine((v) => isValidObjectId(v), "Invalid category id"))
        .optional(),
    functionIds: z
        .array(z.string().trim().refine((v) => isValidObjectId(v), "Invalid function id"))
        .optional(),
    isPOR: z.boolean().default(false),
    price: z.number().nonnegative().default(0),
    status: z.enum(["active", "inactive"]).default("active"),
    stockLevel: z.number().int().nonnegative().default(0),
    gstPercent: z.number().min(0).max(100).default(0),
    isNewProduct: z.boolean().default(false),
});

// --- small local helpers for path construction (hierarchy) ---
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
    return ".bin";
}
/** brands/<brandSlug>/<productSlug>/<uuid>.<ext> */
function productImageKey(
    brandName: string,
    productName: string,
    file: { type?: string; name?: string }
) {
    const brandSlug = slugify(brandName);
    const productSlug = slugify(productName);
    const ext = extFromMimeOrName(file.type, file.name);
    return `brands/${brandSlug}/${productSlug}/${randomUUID()}${ext}`;
}

export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (!auth) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        await dbConnect();
        const ProductModule = await import("@/models/Product");
        const Product = ProductModule.default;

        const { searchParams } = new URL(req.url);
        const filter: any = {};
        const brandId = searchParams.get("brandId");
        const categoryIds = searchParams.getAll("categoryIds");
        const functionIds = searchParams.getAll("functionIds");
        if (brandId) filter.brandId = brandId;
        if (categoryIds.length) filter.categoryIds = { $in: categoryIds };
        if (functionIds.length) filter.functionIds = { $in: functionIds };

        const items = await Product.find(filter)
            .sort({ createdAt: -1 })
            .populate("brandId", "name")
            .populate("categoryIds", "name")
            .populate("functionIds", "name")
            .lean();

        const data = items.map((p: any) => ({
            ...p,
            id: p._id,
            brand: p.brandId?.name ?? null,
            categories: Array.isArray(p.categoryIds) ? p.categoryIds.map((c: any) => c?.name) : [],
            functions: Array.isArray(p.functionIds) ? p.functionIds.map((f: any) => f?.name) : [],
        }));
        return NextResponse.json({ ok: true, data }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json(
            { ok: false, error: err?.message ?? "Failed to fetch products" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    const auth = requireAuth(req);
    if (!auth) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const form = await req.formData();
        const name = (form.get("name") as string | null)?.trim() ?? "";
        const descriptionRaw = (form.get("description") as string | null)?.trim() ?? "";
        const specificationRaw = (form.get("specification") as string | null)?.trim() ?? "";
        const brandId = (form.get("brandId") as string | null)?.trim() ?? "";
        const categoryIds = form.getAll("categoryIds").map((v) => (v as string).trim()).filter(Boolean);
        const functionIds = form.getAll("functionIds").map((v) => (v as string).trim()).filter(Boolean);
        const isPOR = (form.get("isPOR") as string | null) === "true";
        const price = isPOR ? 0 : Number((form.get("price") as string | null) ?? 0);
        const status = (form.get("status") as string | null)?.trim() ?? "active";
        const stockLevel = Number((form.get("stockLevel") as string | null) ?? 0);
        const gstPercent = Number((form.get("gstPercent") as string | null) ?? 0);
        const isNewProduct = (form.get("isNewProduct") as string | null) === "true";

        // Images (now upload to R2 with brand/product hierarchy)
        const imagesFiles = form.getAll("images").filter((f) => f instanceof File) as File[];
        let images: string[] = [];
        const validTypes = ["image/png", "image/jpeg"]; // keep existing behavior
        const MAX_BYTES = 2 * 1024 * 1024; // 2MB

        // Need brand name to build hierarchy
        await dbConnect();
        const BrandModule = await import("@/models/Brand");
        const Brand = BrandModule.default;
        const brandDoc = await Brand.findById(brandId).lean();
        if (!brandDoc) {
            return NextResponse.json({ ok: false, error: "Invalid brand id" }, { status: 400 });
        }
        const brandNameForKey = (typeof brandDoc === 'object' && brandDoc !== null && 'name' in brandDoc)
            ? (brandDoc.name as string)
            : '';

        for (const image of imagesFiles) {
            if (!validTypes.includes(image.type)) {
                return NextResponse.json({ ok: false, error: "Invalid image file type" }, { status: 400 });
            }
            if ((image as any).size > MAX_BYTES) {
                return NextResponse.json({ ok: false, error: "Image too large (max 2MB)" }, { status: 400 });
            }

            const key = productImageKey(brandNameForKey, name, { type: image.type, name: image.name });
            const buffer = Buffer.from(await image.arrayBuffer());
            const { url } = await uploadBufferToR2({
                buffer,
                key,
                contentType: image.type || "application/octet-stream",
            });
            images.push(url); // keep schema as URL list
        }

        // Main image index (unchanged)
        let mainImage = "";
        const mainImageIndexRaw = form.get("mainImageIndex") as string | null;
        const mainImageIndex = mainImageIndexRaw ? Number(mainImageIndexRaw) : 0;
        if (images.length && mainImageIndex >= 0 && mainImageIndex < images.length) {
            mainImage = images[mainImageIndex];
        }

        // Normalize optional fields
        const description = descriptionRaw || undefined;
        const specification = specificationRaw || undefined;

        // Validate payload (server-side)
        const parsed = ProductCreateSchema.parse({
            name,
            description,
            specification,
            brandId,
            categoryIds,
            functionIds,
            isPOR,
            price,
            status,
            stockLevel,
            gstPercent,
            isNewProduct,
        });

        const ProductModule = await import("@/models/Product");
        const Product = ProductModule.default;

        // Initialize priceHistory with the current price (unchanged)
        const initialPrice = typeof parsed.price === "number" ? parsed.price : 0;
        const priceHistory = [{ price: initialPrice, date: new Date() }];

        const created = await Product.create({
            ...parsed,
            images, // URLs from R2
            mainImage,
            priceHistory,
        });

        return NextResponse.json({ ok: true, data: created }, { status: 201 });
    } catch (err: any) {
        if (err?.code === 11000) {
            return NextResponse.json({ ok: false, error: "Some error occured" }, { status: 409 });
        }
        const message = err?.errors?.[0]?.message ?? err?.message ?? "Failed to create product";
        return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
}
