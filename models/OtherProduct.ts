// // models/OtherProduct.ts
// import { Schema, model, models, Types } from "mongoose"

// const OtherProductSchema = new Schema(
//     {
//         name: String,                  // from form
//         description: String,           // from form
//         categoryId: {                  // from live categories dropdown
//             type: Types.ObjectId,
//             ref: "ProductCategory",
//         },
//         price: Number,                 // numeric string from form, convert server-side if needed
//         sku: { type: String, index: true }, // optional; often useful to index
//         status: String,                // "active" | "inactive"
//     },
//     { timestamps: true }
// )

// export default models.OtherProduct || model("OtherProduct", OtherProductSchema)


import mongoose, { Schema, model, models } from "mongoose"

const OtherProductSchema = new Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 200 },
        description: { type: String, default: "" },
        specification: { type: String, default: "" },            // NEW
        price: { type: Number, min: 0 },
        status: { type: String, enum: ["active", "inactive"], default: "active" },

        // NEW: multiple categories & functions
        categoryIds: [{ type: Schema.Types.ObjectId, ref: "ProductCategory" }],
        functionIds: [{ type: Schema.Types.ObjectId, ref: "ProductFunction" }],
    },
    { timestamps: true }
)

export default models.OtherProduct || model("OtherProduct", OtherProductSchema)
