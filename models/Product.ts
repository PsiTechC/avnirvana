// import { Schema, model, models, Types } from "mongoose";

// const ProductSchema = new Schema({
//     name: { type: String, required: true, index: true },
//     description: String,
//     brandId: { type: Types.ObjectId, ref: "Brand", required: true, index: true },
//     categoryId: { type: Types.ObjectId, ref: "ProductCategory" },
//     functionId: { type: Types.ObjectId, ref: "ProductFunction" },
//     price: { type: Number, required: true, min: 0 },
//     isPOR: { type: Boolean, default: false },
//     imageUrl: String,
//     sku: { type: String, unique: true, sparse: true },
//     status: { type: String, enum: ["active", "inactive"], default: "active" },
//     stockLevel: { type: Number, default: 0, min: 0 },
// }, { timestamps: true });

// export default models.Product || model("Product", ProductSchema);





//models/Product.ts
import mongoose, { Schema, model, models } from "mongoose";

export interface Product {
  _id?: string;
  name: string;
  description?: string;
  specification?: string;
  brandId?: string;
  categoryIds?: string[];
  functionIds?: string[];
  price?: number;
  // sku?: string;
  status: "active" | "inactive";
  images?: string[]; // Array of image URLs
  mainImage?: string; // Main image URL
  priceHistory?: { price: number; date: Date }[];
  createdAt?: Date;
  updatedAt?: Date;
  gstPercent?: number; // GST %
  isNewProduct?: boolean; // Is New Product toggle
  isPOR?: boolean; // Price on Request
}

const ProductSchema = new Schema<Product>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, default: "" },
    specification: { type: String, trim: true, default: "" },
    brandId: { type: Schema.Types.ObjectId, ref: "Brand" },
    categoryIds: [{ type: Schema.Types.ObjectId, ref: "ProductCategory" }],
    functionIds: [{ type: Schema.Types.ObjectId, ref: "ProductFunction" }],
    price: { type: Number },
  // sku: { type: String, trim: true },
    isPOR: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    images: [{ type: String, default: [] }], // Array of image URLs
    mainImage: { type: String, default: "" }, // Main image URL
    priceHistory: [
      {
        price: { type: Number, required: true },
        date: { type: Date, required: true, default: Date.now },
      },
    ],
  gstPercent: { type: Number, default: 0 }, // GST %
  isNewProduct: { type: Boolean, default: false }, // Is New Product toggle
  },
  { timestamps: true }
);

export default models.Product || model<Product>("Product", ProductSchema);
