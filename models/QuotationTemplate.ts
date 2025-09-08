// // models/QuotationTemplate.ts
// import mongoose, { Schema, models, model } from "mongoose";

// const TemplateText = new Schema(
//     { html: String, markdown: String },
//     { _id: false }
// );

// const TemplateCompany = new Schema(
//     { name: String, address: String, phone: String, email: String, gstin: String, logoUrl: String },
//     { _id: false }
// );

// const QuotationTemplateSchema = new Schema(
//     {
//         name: { type: String, required: true },
//         company: TemplateCompany,
//         cover: {
//             bgImageUrl: String,
//             overlay: String,
//             titleColor: { type: String, default: "#ffffff" },
//             subtitleColor: { type: String, default: "#e6e6e6" },
//             accentColor: { type: String, default: "#60a5fa" },
//             showLogo: { type: Boolean, default: true },
//             fontFamily: String,
//         },
//         proposalNote: TemplateText,
//         closingNote: TemplateText,
//         aboutUs: TemplateText,
//         productPage: {
//             cardStyle: { type: String, enum: ["minimal", "shadow", "border"], default: "minimal" },
//             showSku: { type: Boolean, default: false },
//             showShortDesc: { type: Boolean, default: true },
//         },
//         calcPage: {
//             tableStyle: { type: String, enum: ["zebra", "bordered"], default: "zebra" },
//             currency: { type: String, enum: ["INR", "USD"], default: "INR" },
//         },
//         page: {
//             size: { type: String, default: "A4" },
//             topPadding: { type: Number, default: 40 },
//             bottomPadding: { type: Number, default: 40 },
//             leftPadding: { type: Number, default: 32 },
//             rightPadding: { type: Number, default: 32 },
//         },
//     },
//     { timestamps: true }
// );

// export default models.QuotationTemplate ||
//     model("QuotationTemplate", QuotationTemplateSchema);


import mongoose, { Schema, models, model } from "mongoose"

const TemplateText = new Schema({ html: String, markdown: String }, { _id: false })

const TemplateCompany = new Schema(
    { name: String, address: String, phone: String, email: String, gstin: String, logoUrl: String },
    { _id: false }
)

const QuotationTemplateSchema = new Schema(
    {
        name: { type: String, required: true },
        company: TemplateCompany,
        cover: {
            bgImageUrl: String,
            backgroundImage: String, // for uploaded image (data URL or file path)
            overlay: { type: String, default: "linear-gradient(180deg, rgba(0,0,0,.45), rgba(0,0,0,.45))" },
            titleColor: { type: String, default: "#ffffff" },
            subtitleColor: { type: String, default: "#e6e6e6" },
            accentColor: { type: String, default: "#60a5fa" },
            showLogo: { type: Boolean, default: true },
            fontFamily: String,
        },
        proposalNote: TemplateText,
        closingNote: {
            html: String,
            markdown: String,
            closingNoteImage: String, // for uploaded image (data URL or file path)
        },
        aboutUs: {
            html: String,
            markdown: String,
            aboutUsImage: String, // for uploaded image (data URL or file path)
        },
        productPage: {
            cardStyle: { type: String, enum: ["minimal", "shadow", "border"], default: "minimal" },
            showSku: { type: Boolean, default: false },
            showShortDesc: { type: Boolean, default: true },
        },
        calcPage: {
            tableStyle: { type: String, enum: ["zebra", "bordered"], default: "zebra" },
            currency: { type: String, enum: ["INR", "USD"], default: "INR" },
        },
        page: {
            size: { type: String, default: "A4" },
            topPadding: { type: Number, default: 40 },
            bottomPadding: { type: Number, default: 40 },
            leftPadding: { type: Number, default: 32 },
            rightPadding: { type: Number, default: 32 },
        },
    },
    { timestamps: true }
)

export default models.QuotationTemplate || model("QuotationTemplate", QuotationTemplateSchema)
