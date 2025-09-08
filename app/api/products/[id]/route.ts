// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";

// Required for fs/path usage in Next.js route handlers
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---- Project paths ----
import { dbConnect } from "@/lib/mongodb";
import Product from "@/models/Product";
import PriceChange from "@/models/PriceChange";
import Brand from "@/models/Brand";

// ---- R2 helpers ----
import { uploadBufferToR2, deleteFromR2 } from "@/lib/r2helper";

// ---------- util: slug/keys (hierarchy) ----------
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
/** brands/<brandSlug>/<productSlug>/<uuid>.<ext> */
function productImageKey(brandName: string, productName: string, file: { type?: string; name?: string }) {
    const brandSlug = slugify(brandName);
    const productSlug = slugify(productName);
    const ext = extFromMimeOrName(file.type, file.name);
    return `brands/${brandSlug}/${productSlug}/${randomUUID()}${ext}`;
}
/** Convert an R2 public URL to object key (when using public buckets) */
function r2UrlToKey(url: string) {
    const base = (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");
    return base && url.startsWith(base + "/") ? url.slice(base.length + 1) : "";
}

// ---------- Legacy local helpers (kept as fallback) ----------
async function saveImageToPublic(file: File): Promise<string> {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const original = file.name || "upload";
    const type = file.type || "application/octet-stream";
    const extFromName = path.extname(original).toLowerCase();
    const ext = extFromName || (type === "image/png" ? ".png" : type === "image/jpeg" ? ".jpg" : "");

    const filename = `${randomUUID()}${ext}`;
    const fullPath = path.join(uploadDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(fullPath, buffer);

    return `/uploads/${filename}`;
}

// delete either from R2 (if URL belongs to R2) or from local /public/uploads (legacy)
async function tryDeleteImageByUrl(imageUrl?: string | null) {
    if (!imageUrl) return;
    const key = r2UrlToKey(imageUrl);
    if (key) {
        try {
            await deleteFromR2(key);
            return;
        } catch {
            // ignore R2 deletion errors
        }
    }
    // legacy local deletion
    if (imageUrl.startsWith("/uploads/")) {
        const fullPath = path.join(process.cwd(), "public", imageUrl.replace(/^\//, ""));
        try {
            await fs.unlink(fullPath);
        } catch {
            // ignore
        }
    }
}

// GET /api/products/:id  — fetch one
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const doc = await Product.findOne({ _id: params.id })
            .populate("brandId", "name")
            .populate("categoryIds", "name")
            .populate("functionIds", "name")
            .lean();
        if (!doc) {
            return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
        }
        const mapped = !Array.isArray(doc)
            ? {
                ...doc,
                id: doc._id,
                brand: (doc as any).brandId?.name ?? null,
                categories: Array.isArray((doc as any).categoryIds) ? (doc as any).categoryIds.map((c: any) => c?.name) : [],
                functions: Array.isArray((doc as any).functionIds) ? (doc as any).functionIds.map((f: any) => f?.name) : [],
                priceHistory: doc.priceHistory || [],
            }
            : null;
        return NextResponse.json({ ok: true, data: mapped }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message ?? "Failed to fetch product" }, { status: 500 });
    }
}

// PUT /api/products/:id  — update (multipart/form-data)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const form = await req.formData();

        // read fields (trim where sensible)
        const name = (form.get("name") as string | null)?.trim();
        const description = (form.get("description") as string | null)?.trim();
        const specification = (form.get("specification") as string | null)?.trim();
        const brandId = (form.get("brandId") as string | null)?.trim();
        const categoryIds = form.getAll("categoryIds").map((v) => (v as string).trim()).filter(Boolean);
        const functionIds = form.getAll("functionIds").map((v) => (v as string).trim()).filter(Boolean);
        const statusRaw = (form.get("status") as string | null)?.trim();
        const stockLevelRaw = (form.get("stockLevel") as string | null)?.trim();
        const isPORRaw = (form.get("isPOR") as string | null)?.trim();
        const priceRaw = (form.get("price") as string | null)?.trim();

        const updates: Record<string, any> = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description || undefined;
        if (specification !== undefined) updates.specification = specification || undefined;
        if (brandId !== undefined) updates.brandId = brandId;
        if (categoryIds.length) updates.categoryIds = categoryIds;
        if (functionIds.length) updates.functionIds = functionIds;
        if (statusRaw !== undefined) {
            updates.status = statusRaw === "inactive" ? "inactive" : "active";
        }
        if (stockLevelRaw !== undefined) {
            const n = Number(stockLevelRaw);
            updates.stockLevel = Number.isFinite(n) && n >= 0 ? n : 0;
        }
        // GST %
        const gstPercentRaw = form.get("gstPercent") as string | null;
        if (gstPercentRaw !== undefined && gstPercentRaw !== null) {
            const gst = Number(gstPercentRaw);
            updates.gstPercent = Number.isFinite(gst) && gst >= 0 ? gst : 0;
        }
        // Is New Product
        const isNewProductRaw = form.get("isNewProduct") as string | null;
        if (isNewProductRaw !== undefined && isNewProductRaw !== null) {
            updates.isNewProduct = isNewProductRaw === "true" || isNewProductRaw === "1";
        }

        let priceChanged = false;
        let newPrice: number | undefined = undefined;
        if (isPORRaw !== undefined) {
            const isPOR = isPORRaw === "true" || isPORRaw === "1";
            updates.isPOR = isPOR;
            if (priceRaw !== undefined) {
                const p = Number(priceRaw);
                newPrice = isPOR ? 0 : Number.isFinite(p) && p >= 0 ? p : 0;
                updates.price = newPrice;
                priceChanged = true;
            }
        } else if (priceRaw !== undefined) {
            const p = Number(priceRaw);
            newPrice = Number.isFinite(p) && p >= 0 ? p : 0;
            updates.price = newPrice;
            priceChanged = true;
        }

        // Images handling
        await dbConnect();
        const existing = await Product.findById(id);
        if (!existing) {
            return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
        }

        let images = Array.isArray(existing.images) ? [...existing.images] : [];

        // Handle priceHistory update if price changed
        if (priceChanged && typeof newPrice === "number" && newPrice !== existing.price) {
            const now = new Date();
            const priceHistory = Array.isArray(existing.priceHistory) ? [...existing.priceHistory] : [];
            priceHistory.push({ price: newPrice, date: now });
            updates.priceHistory = priceHistory;
            await PriceChange.findOneAndUpdate(
                { productId: existing._id, effectiveTo: null },
                { $set: { effectiveTo: now } },
                { sort: { effectiveFrom: -1 } }
            );
            await PriceChange.create({
                productId: existing._id,
                price: newPrice,
                isPOR: updates.isPOR ?? existing.isPOR ?? false,
                note: "",
                effectiveFrom: now,
                effectiveTo: null,
            });
        }

        // Remove images by index (only those explicitly marked)
        const removeImageIndexesRaw = form.get("removeImageIndexes") as string | null;
        if (removeImageIndexesRaw) {
            try {
                const removeIndexes: number[] = JSON.parse(removeImageIndexesRaw);
                removeIndexes.sort((a, b) => b - a);
                for (const idx of removeIndexes) {
                    const url = images[idx];
                    await tryDeleteImageByUrl(url);
                    images.splice(idx, 1);
                }
            } catch { }
        }

        // Add new images (append to existing)
        const imagesFiles = form.getAll("images").filter((f) => f instanceof File) as File[];
        const validTypes = ["image/png", "image/jpeg"];
        const MAX_BYTES = 2 * 1024 * 1024;

        // get brand name to build key; prefer incoming brandId, else existing.brandId
        const brandIdToUse = (updates.brandId as string) || String(existing.brandId || "");
        let brandNameForKey = "";
        if (brandIdToUse) {
            const brandDoc = await Brand.findById(brandIdToUse).lean();
            if (!brandDoc) {
                return NextResponse.json({ ok: false, error: "Invalid brand id" }, { status: 400 });
            }
            brandNameForKey = (typeof brandDoc === 'object' && brandDoc !== null && 'name' in brandDoc)
                ? (brandDoc.name as string)
                : '';
        } else {
            brandNameForKey = "brand";
        }
        const productNameForKey = (updates.name as string) || existing.name || "product";

        for (const image of imagesFiles) {
            if (!validTypes.includes(image.type)) {
                return NextResponse.json({ ok: false, error: "Invalid image file type" }, { status: 400 });
            }
            if ((image as any).size > MAX_BYTES) {
                return NextResponse.json({ ok: false, error: "Image too large (max 2MB)" }, { status: 400 });
            }
            const key = productImageKey(brandNameForKey, productNameForKey, { type: image.type, name: image.name });
            const buffer = Buffer.from(await image.arrayBuffer());
            const { url } = await uploadBufferToR2({
                buffer,
                key,
                contentType: image.type || "application/octet-stream",
            });
            images.push(url);
        }

        // Set main image
        const mainImageIndexRaw = form.get("mainImageIndex") as string | null;
        let mainImage = "";
        const mainImageIndex = mainImageIndexRaw ? Number(mainImageIndexRaw) : 0;
        if (images.length && mainImageIndex >= 0 && mainImageIndex < images.length) {
            mainImage = images[mainImageIndex];
        }
        updates.images = images;
        updates.mainImage = mainImage;

        const updated = await Product.findByIdAndUpdate(id, updates, { new: true });
        if (!updated) {
            return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
        }
        return NextResponse.json({ ok: true, data: updated }, { status: 200 });
    } catch (err: any) {
        const message = err?.message ?? "Failed to update product";
        return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
}

// DELETE /api/products/:id — delete product (and its image if local/R2)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const existing = await Product.findById(params.id);
        if (!existing) {
            return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
        }

        // legacy single image field support (kept)
        if ((existing as any).imageUrl) {
            await tryDeleteImageByUrl((existing as any).imageUrl);
        }

        // also clean up array images + mainImage (new behavior; non-breaking)
        const toDelete = new Set<string>();
        if (Array.isArray(existing.images)) {
            for (const u of existing.images) if (typeof u === "string" && u) toDelete.add(u);
        }
        if (typeof existing.mainImage === "string" && existing.mainImage) {
            toDelete.add(existing.mainImage);
        }
        for (const url of toDelete) {
            await tryDeleteImageByUrl(url); // R2-aware or local
        }

        await Product.findByIdAndDelete(params.id);
        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json(
            { ok: false, error: err?.message ?? "Failed to delete product" },
            { status: 500 }
        );
    }
}
