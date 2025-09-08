// models/OtherBrand.ts
import { Schema, model, models } from "mongoose"

const OtherBrandSchema = new Schema(
    {
        name: { type: String, required: true, index: true },
        description: String,
        websiteUrl: String,
        status: { type: String, enum: ["active", "inactive"], default: "active" },
    },
    { timestamps: true }
)

export default models.OtherBrand || model("OtherBrand", OtherBrandSchema)
