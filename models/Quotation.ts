

// // models/Quotation.ts
// import { Schema, model, models, Types } from "mongoose"

// const QuotationItemSchema = new Schema(
//     {
//         productId: { type: Types.ObjectId, ref: "Product", required: true },
//         productName: { type: String, required: true }, // snapshot
//         quantity: { type: Number, required: true, min: 1 },
//         unitPrice: { type: Number, required: true, min: 0 },
//         total: { type: Number, required: true, min: 0 }, // quantity * unitPrice for the row
//     },
//     { _id: false }
// )

// const QuotationSchema = new Schema(
//     {
//         quotationNumber: { type: String, required: true, unique: true, index: true },

//         // Dealer reference + optional snapshot fields (handy for historical accuracy)
//         dealerId: { type: Types.ObjectId, ref: "Dealer", required: true, index: true },
//         dealerName: { type: String }, // snapshot (optional)
//         contactPerson: String,
//         email: String,
//         phone: String,
//         address: String,
//         city: String,
//         zipCode: String,

//         status: {
//             type: String,
//             enum: ["Draft", "Sent", "Accepted", "Rejected", "Expired"],
//             default: "Draft",
//         },

//         createdDate: { type: Date, default: Date.now },
//         validUntil: { type: Date, required: true },

//         items: { type: [QuotationItemSchema], default: [] },

//         // Totals
//         subtotal: { type: Number, required: true, min: 0 }, // sum of row totals
//         tax: { type: Number, required: true, min: 0 },      // your code uses 18%
//         discount: { type: Number, default: 0, min: 0 },     // absolute amount (new)
//         // NOTE: "total" is the GRAND TOTAL after discount: subtotal + tax - discount
//         total: { type: Number, required: true, min: 0 },

//         notes: String,

//         createdById: { type: Types.ObjectId, ref: "User" },
//     },
//     { timestamps: true }
// )

// // Safety: if client didn’t compute totals exactly, normalize before save.
// QuotationSchema.pre("validate", function (next) {
//     // Ensure numeric fields exist
//     this.subtotal = Number(this.subtotal || 0)
//     this.tax = Number(this.tax || 0)
//     this.discount = Number(this.discount || 0)

//     const computed = Math.max(0, this.subtotal + this.tax - this.discount)
//     // If total is missing or off by a small float epsilon, set it.
//     if (typeof this.total !== "number" || Math.abs(this.total - computed) > 0.01) {
//         this.total = computed
//     }
//     next()
// })

// // Helpful indexes
// QuotationSchema.index({ dealerId: 1, createdAt: -1 })
// QuotationSchema.index({ quotationNumber: 1 }, { unique: true })

// export default models.Quotation || model("Quotation", QuotationSchema)



// models/Quotation.ts
import { Schema, model, models, Types } from "mongoose"


const QuotationItemSchema = new Schema(
    {
        productId: { type: Types.ObjectId, ref: "Product", required: true },
        productName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
    },
    { _id: false }
)

const QuotationAreaSchema = new Schema(
    {
        areaRoomTypeId: { type: Types.ObjectId, ref: "AreaRoomType", required: true },
        areaRoomTypeName: { type: String, required: true },
        items: { type: [QuotationItemSchema], default: [] },
    },
    { _id: false }
)


const QuotationSchema = new Schema(
    {
        quotationNumber: { type: String, required: true, unique: true, index: true },
        dealerId: { type: Types.ObjectId, ref: "Dealer", required: true, index: true },
        contactPerson: String,
        email: String,
        phone: String,

        status: {
            type: String,
            enum: ["Draft", "Sent", "Accepted", "Rejected", "Expired"],
            default: "Draft",
            index: true,
        },

        createdDate: { type: Date, default: Date.now },
        validUntil: { type: Date, required: true },

        areas: { type: [QuotationAreaSchema], default: [] },

        // computed server-side
        subtotal: { type: Number, required: true, min: 0 },
        tax: { type: Number, required: true, min: 0 },
        discount: { type: Number, required: true, min: 0, default: 0 },
        total: { type: Number, required: true, min: 0 },

        notes: String,

        createdById: { type: Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
)

export default models.Quotation || model("Quotation", QuotationSchema)
