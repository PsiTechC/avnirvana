

// app/api/dealers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import Dealer from "@/models/Dealer";
import { dbConnect } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---- R2 helpers ----
import path from "path";
import { uploadBufferToR2, deleteFromR2 } from "@/lib/r2helper";

// --- minimal helpers for key building & url->key ---
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
/** dealerlogo/<dealer-slug>.<ext> */
function dealerLogoKey(dealerName: string, file: { type?: string; name?: string }) {
    const dealerSlug = slugify(dealerName);
    const ext = extFromMimeOrName(file.type, file.name);
    return `dealerlogo/${dealerSlug}${ext}`;
}
function r2UrlToKey(url: string) {
    const base = (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");
    return base && url.startsWith(base + "/") ? url.slice(base.length + 1) : "";
}

// Legacy local fallback (kept for old /uploads files, used only on cleanup)
async function tryDeleteLocalByUrl(imageUrl?: string | null) {
    if (!imageUrl) return;
    if (!imageUrl.startsWith("/uploads/")) return;
    const fs = await import("fs/promises");
    const fullPath = path.join(process.cwd(), "public", imageUrl.replace(/^\//, ""));
    try {
        await fs.unlink(fullPath);
    } catch {
        // ignore
    }
}

// GET /api/dealers/:id — fetch a single dealer (unchanged)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const item = await Dealer.findById(params.id);
        if (!item) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
        return NextResponse.json({ ok: true, data: item }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message ?? "Failed to fetch" }, { status: 400 });
    }
}

// PATCH /api/dealers/:id — update (multipart/form-data; supports new logo)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const form = await req.formData();
        const updates: any = {};

        // Plain fields (only set if present) — unchanged
        const keys = [
            "name",
            "contactPerson",
            "email",
            "phone",
            "address",
            "city",
            "state",
            "zipCode",
            "status",
            "dealerType",
            "territory",
        ];
        for (const k of keys) {
            const v = form.get(k) as string | null;
            if (v !== null) updates[k] = v;
        }


        // Handle logo removal
        const removeLogo = form.get("removeLogo") as string | null;
        if (removeLogo === "true") {
            await dbConnect();
            const dealer = await Dealer.findById(params.id);
            if (dealer && dealer.logoUrl) {
                const oldKey = r2UrlToKey(dealer.logoUrl);
                if (oldKey) {
                    try {
                        await deleteFromR2(oldKey);
                    } catch {}
                } else {
                    await tryDeleteLocalByUrl(dealer.logoUrl);
                }
            }
            updates.logoUrl = "";
        }

        // Handle logo upload
        const logo = form.get("logo") as File | null;
        if (logo && (logo as any).size > 0) {
            const validTypes = ["image/png", "image/jpeg"];
            if (!validTypes.includes(logo.type)) {
                return NextResponse.json({ ok: false, error: "Invalid logo file type" }, { status: 400 });
            }
            if ((logo as any).size > 2 * 1024 * 1024) {
                return NextResponse.json({ ok: false, error: "Logo too large (max 2MB)" }, { status: 400 });
            }

            await dbConnect();
            const dealer = await Dealer.findById(params.id);
            if (!dealer) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

            const dealerNameForKey = (updates.name as string) || dealer.name || "dealer";
            const key = dealerLogoKey(dealerNameForKey, { type: logo.type, name: logo.name });
            const buffer = Buffer.from(await logo.arrayBuffer());
            const { url } = await uploadBufferToR2({
                buffer,
                key,
                contentType: logo.type || "application/octet-stream",
            });

            // Delete old asset (R2 or legacy local) after successful upload
            if (dealer.logoUrl) {
                const oldKey = r2UrlToKey(dealer.logoUrl);
                if (oldKey) {
                    try {
                        await deleteFromR2(oldKey);
                    } catch {}
                } else {
                    await tryDeleteLocalByUrl(dealer.logoUrl);
                }
            }

            updates.logoUrl = url;
        }

        await dbConnect();
        const updated = await Dealer.findByIdAndUpdate(params.id, updates, { new: true });
        if (!updated) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

        return NextResponse.json({ ok: true, data: updated }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message ?? "Failed to update" }, { status: 400 });
    }
}

// DELETE /api/dealers/:id — delete (unchanged behavior: does not remove logo asset)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const deleted = await Dealer.findByIdAndDelete(params.id);
        if (!deleted) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
        return NextResponse.json({ ok: true, data: { _id: params.id } }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message ?? "Failed to delete" }, { status: 400 });
    }
}
