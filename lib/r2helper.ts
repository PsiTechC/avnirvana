import { PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { r2Client } from "@/config/r2";

const bucket = process.env.R2_BUCKET!;
const publicBase = (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");

if (!bucket) throw new Error("R2_BUCKET is not set");

export function keyToPublicUrl(key: string) {
    if (!publicBase) throw new Error("R2_PUBLIC_URL is not set for public buckets");
    return `${publicBase}/${key.replace(/^\/+/, "")}`;
}
export function publicUrlToKey(url: string) {
    const base = publicBase ? publicBase + "/" : "";
    return base && url.startsWith(base) ? url.slice(base.length) : url.replace(/^\/+/, "");
}

export async function uploadBufferToR2(opts: {
    buffer: Buffer;
    key: string;
    contentType?: string;
    cacheControl?: string;
}): Promise<{ key: string; url: string }> {
    const upload = new Upload({
        client: r2Client,
        params: {
            Bucket: bucket,
            Key: opts.key,
            Body: opts.buffer,
            ContentType: opts.contentType || "application/octet-stream",
            CacheControl: opts.cacheControl ?? "public, max-age=31536000, immutable",
        },
    });
    await upload.done();
    const url = publicBase ? keyToPublicUrl(opts.key) : "";
    return { key: opts.key, url };
}

export async function deleteFromR2(key: string): Promise<void> {
    try {
        await r2Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        await r2Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    } catch {
        // ignore not found
    }
}
