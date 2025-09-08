import { NextResponse, NextRequest } from "next/server";
import QuotationTemplate from "@/models/QuotationTemplate";
import { dbConnect } from "@/lib/mongodb";
import path from "path";
import fs from "fs";
import { requireAuth } from "@/lib/auth";
const fsp = fs.promises;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/quotation-templates — list templates (newest first)
export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (!auth) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const items = await QuotationTemplate.find().sort({ updatedAt: -1 });
    return NextResponse.json({ data: items });
}

// POST /api/quotation-templates — create template
export async function POST(req: NextRequest) {
    const auth = requireAuth(req);
    if (!auth) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const form = await req.formData();
    const name = (form.get("name") as string | null)?.trim() ?? "";
    const aboutUs = (form.get("aboutUs") as string | null)?.trim() ?? "";
    const proposalNote = (form.get("proposalNote") as string | null)?.trim() ?? "";
    const closingNote = (form.get("closingNote") as string | null)?.trim() ?? "";

    // Images (Cloudflare R2)
    const backgroundImageFile = form.get("backgroundImage") as File | null;
    const closingNoteImageFile = form.get("closingNoteImage") as File | null;
    const aboutUsImageFile = form.get("aboutUsImage") as File | null;
    let backgroundImageUrl = "";
    let closingNoteImageUrl = "";
    let aboutUsImageUrl = "";

    // Import R2 helper
    const { uploadBufferToR2, keyToPublicUrl } = await import("@/lib/r2helper");

    if (backgroundImageFile && backgroundImageFile instanceof File) {
        const arrayBuffer = await backgroundImageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        // Use a hierarchical key for template backgrounds
        const ext = backgroundImageFile.type === "image/png" ? ".png" : backgroundImageFile.type === "image/jpeg" ? ".jpg" : path.extname(backgroundImageFile.name) || "";
        const key = `quotation-templates/backgrounds/template-bg-${Date.now()}${ext}`;
        const result = await uploadBufferToR2({ buffer, key, contentType: backgroundImageFile.type || "application/octet-stream" });
        backgroundImageUrl = result.url;
    }
    if (closingNoteImageFile && closingNoteImageFile instanceof File) {
        const arrayBuffer = await closingNoteImageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const ext = closingNoteImageFile.type === "image/png" ? ".png" : closingNoteImageFile.type === "image/jpeg" ? ".jpg" : path.extname(closingNoteImageFile.name) || "";
        const key = `quotation-templates/closing-notes/template-closing-${Date.now()}${ext}`;
        const result = await uploadBufferToR2({ buffer, key, contentType: closingNoteImageFile.type || "application/octet-stream" });
        closingNoteImageUrl = result.url;
    }
    if (aboutUsImageFile && aboutUsImageFile instanceof File) {
        const arrayBuffer = await aboutUsImageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const ext = aboutUsImageFile.type === "image/png" ? ".png" : aboutUsImageFile.type === "image/jpeg" ? ".jpg" : path.extname(aboutUsImageFile.name) || "";
        const key = `quotation-templates/about-us/template-aboutus-${Date.now()}${ext}`;
        const result = await uploadBufferToR2({ buffer, key, contentType: aboutUsImageFile.type || "application/octet-stream" });
        aboutUsImageUrl = result.url;
    }

    // Map fields to template
    const templateData = {
        name,
        company: {},
        cover: {
            bgImageUrl: backgroundImageUrl,
            backgroundImage: backgroundImageUrl,
            
        },
        proposalNote: { html: proposalNote, markdown: "" },
        closingNote: { html: closingNote, markdown: "", closingNoteImage: closingNoteImageUrl },
        aboutUs: { html: aboutUs, markdown: "", aboutUsImage: aboutUsImageUrl },
    };
    const created = await QuotationTemplate.create(templateData);
    return NextResponse.json({ data: created }, { status: 201 });
}