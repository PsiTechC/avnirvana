
// app/api/brands/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/mongodb";
import Brand from "@/models/Brand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UpdateBrandSchema = z.object({
    name: z.string().min(1).max(120).optional(),
    description: z.string().max(500).optional(),
    websiteUrl: z
        .string()
        .url()
        .max(2048)
        .optional()
        .or(z.literal("").transform(() => undefined)),
    status: z.enum(["active", "inactive"]).optional(),
});

type ParamsPromise = { params: Promise<{ id: string }> };

// ---- R2 helpers (for key building + deletion) ----
import path from "path";
import { uploadBufferToR2, deleteFromR2 } from "@/lib/r2helper";

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
function r2UrlToKey(url: string) {
    const base = (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");
    return base && url.startsWith(base + "/") ? url.slice(base.length + 1) : "";
}

// GET /api/brands/[id]
export async function GET(_req: NextRequest, context: ParamsPromise) {
    try {
        const { id } = await context.params;
        await dbConnect();
        const brand = await Brand.findById(id);
        if (!brand) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
        return NextResponse.json({ ok: true, data: brand }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json(
            { ok: false, error: err?.message ?? "Failed to fetch" },
            { status: 500 }
        );
    }
}

// PATCH /api/brands/[id]
export async function PATCH(req: NextRequest, context: ParamsPromise) {
    try {
        const { id } = await context.params;

        let name: string | undefined;
        let description: string | undefined;
        let websiteUrl: string | undefined;
        let status: string | undefined;
        let logoUrl: string | undefined;
        let updatePayload: Record<string, any> = {};
        let removeLogo = false;

        const contentType = req.headers.get("content-type") || "";
        if (contentType.includes("multipart/form-data")) {
            const form = await req.formData();
            name = (form.get("name") as string | null)?.trim() ?? undefined;
            description = (form.get("description") as string | null)?.trim() ?? undefined;
            websiteUrl = (form.get("websiteUrl") as string | null)?.trim() ?? undefined;
            status = (form.get("status") as string | null)?.trim() ?? undefined;

            const logo = form.get("logo") as File | null;
            const logoUrlField = form.get("logoUrl") as string | null;

            if (logo) {
                // Validate type and size (kept as-is)
                const validTypes = ["image/png", "image/jpeg"];
                if (!validTypes.includes(logo.type)) {
                    return NextResponse.json({ ok: false, error: "Invalid logo file type" }, { status: 400 });
                }
                const MAX_BYTES = 2 * 1024 * 1024;
                if ((logo as any).size > MAX_BYTES) {
                    return NextResponse.json(
                        { ok: false, error: "Logo too large (max 2MB)" },
                        { status: 400 }
                    );
                }

                // Upload new logo to R2, then delete the old asset to save storage.
                await dbConnect();
                const existing = await Brand.findById(id);
                if (!existing) {
                    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
                }

                const buffer = Buffer.from(await logo.arrayBuffer());
                const key = brandLogoKey(name || existing.name || "brand", { type: logo.type, name: logo.name });

                const { url } = await uploadBufferToR2({
                    buffer,
                    key,
                    contentType: logo.type,
                });

                // Delete previously stored logo (R2 or local), only after successful upload
                if (existing.logoUrl) {
                    const oldKey = r2UrlToKey(existing.logoUrl);
                    if (oldKey) {
                        try {
                            await deleteFromR2(oldKey);
                        } catch {
                            // ignore deletion errors
                        }
                    } else {
                        // Fallback to local cleanup for legacy /uploads URLs
                        try {
                            const fs = await import("fs/promises");
                            const oldLocalPath = path.join(process.cwd(), "public", existing.logoUrl.replace(/^\//, ""));
                            await fs.unlink(oldLocalPath);
                        } catch {
                            // ignore
                        }
                    }
                }

                logoUrl = url;
                updatePayload.logoUrl = logoUrl;
            } else if (logoUrlField === "") {
                // User requested to remove logo (kept behavior)
                removeLogo = true;
                updatePayload.logoUrl = "";
            }

            if (name !== undefined) updatePayload.name = name;
            if (description !== undefined) updatePayload.description = description;
            if (websiteUrl !== undefined) updatePayload.websiteUrl = websiteUrl;
            if (status !== undefined) updatePayload.status = status;
        } else {
            // JSON body fallback (unchanged)
            const body = await req.json().catch(() => ({}));
            const parsed = UpdateBrandSchema.parse(body);
            updatePayload = parsed;
        }

        await dbConnect();

        // If removing logo explicitly, delete stored asset (R2 or local)
        if (removeLogo) {
            const brand = await Brand.findById(id);
            if (brand && brand.logoUrl) {
                const key = r2UrlToKey(brand.logoUrl);
                if (key) {
                    try {
                        await deleteFromR2(key);
                    } catch {
                        // ignore
                    }
                } else {
                    // Fallback: delete legacy local file
                    try {
                        const fs = await import("fs/promises");
                        const logoPath = path.join(process.cwd(), "public", brand.logoUrl.replace(/^\//, ""));
                        await fs.unlink(logoPath);
                    } catch {
                        // ignore
                    }
                }
            }
        }

        const updated = await Brand.findByIdAndUpdate(
            id,
            { $set: updatePayload },
            { new: true, runValidators: true }
        );
        if (!updated) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

        return NextResponse.json({ ok: true, data: updated }, { status: 200 });
    } catch (err: any) {
        const message = err?.errors?.[0]?.message ?? err?.message ?? "Failed to update";
        return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
}

// DELETE /api/brands/[id] (unchanged: does not delete logo asset)
export async function DELETE(_req: NextRequest, context: ParamsPromise) {
    try {
        const { id } = await context.params;
        await dbConnect();
        const removed = await Brand.findByIdAndDelete(id);
        if (!removed) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json(
            { ok: false, error: err?.message ?? "Failed to delete" },
            { status: 400 }
        );
    }
}
