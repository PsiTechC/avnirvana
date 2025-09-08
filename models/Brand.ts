import { Schema, model, models } from "mongoose";

const BrandSchema = new Schema({
    name: { type: String, required: true, index: true },
    description: String,
    logoUrl: String,
    logoPath: String,
    logoFilename: String,
    websiteUrl: String,
    status: { type: String, enum: ["active", "inactive"], default: "active" },
}, { timestamps: true });

// Add index for logoUrl and logoPath
BrandSchema.index({ logoUrl: 1 });
BrandSchema.index({ logoPath: 1 });

export default models.Brand || model("Brand", BrandSchema);
