import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProductOrder extends Document {
  brandId: string;
  productOrder: string[];
}

const ProductOrderSchema: Schema<IProductOrder> = new Schema({
  brandId: { type: String, required: true, unique: true },
  productOrder: { type: [String], required: true },
});

const ProductOrder: Model<IProductOrder> = mongoose.models.ProductOrder || mongoose.model<IProductOrder>("ProductOrder", ProductOrderSchema);

export default ProductOrder;
