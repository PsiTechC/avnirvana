// models/PriceChange.ts
import { Schema, model, models, Types } from "mongoose"

const PriceChangeSchema = new Schema({
    productId: { type: Types.ObjectId, ref: "Product", index: true, required: true },
    price: { type: Number, min: 0 },
    isPOR: { type: Boolean, default: false },
    note: { type: String, trim: true },
    effectiveFrom: { type: Date, required: true, index: true },
    effectiveTo: { type: Date, default: null },
}, { timestamps: true })

export default models.PriceChange || model("PriceChange", PriceChangeSchema)
