import { randomUUID } from "crypto";
import path from "path";

export function slugify(input: string, { max = 80 } = {}) {
    return (input || "unnamed")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase()
        .slice(0, max);
}

export function extFromMimeOrName(mime: string | undefined, filename?: string) {
    const explicit = filename ? path.extname(filename) : "";
    if (explicit) return explicit;
    if (mime === "image/png") return ".png";
    if (mime === "image/jpeg") return ".jpg";
    if (mime === "image/webp") return ".webp";
    return ".bin";
}

/** brands/<brandSlug>/brand-logo.<ext> */
export function brandLogoKey(brandName: string, file: { type?: string; name?: string }) {
    const brandSlug = slugify(brandName);
    const ext = extFromMimeOrName(file.type, file.name);
    return `brands/${brandSlug}/brand-logo${ext}`;
}

/** brands/<brandSlug>/<productSlug>/<uuid>.<ext> */
export function productImageKey(
    brandName: string,
    productName: string,
    file: { type?: string; name?: string }
) {
    const brandSlug = slugify(brandName);
    const productSlug = slugify(productName);
    const ext = extFromMimeOrName(file.type, file.name);
    return `brands/${brandSlug}/${productSlug}/${randomUUID()}${ext}`;
}

/** dealerlogo/<dealerSlug>.<ext> */
export function dealerLogoKey(dealerName: string, file: { type?: string; name?: string }) {
    const dealerSlug = slugify(dealerName);
    const ext = extFromMimeOrName(file.type, file.name);
    return `dealerlogo/${dealerSlug}${ext}`;
}
