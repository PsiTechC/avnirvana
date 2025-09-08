// import { Schema, model, models } from "mongoose";

// const ProductCategorySchema = new Schema({
//     name: { type: String, required: true, unique: true },
// }, { timestamps: true });

// export default models.ProductCategory || model("ProductCategory", ProductCategorySchema);


import { Schema, model, models } from "mongoose"

const ProductCategorySchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            unique: true,
            trim: true,
            minlength: [2, "Category name must be at least 2 characters long"],
            maxlength: [100, "Category name must be less than 100 characters"],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, "Description must be less than 500 characters"],
        },
    },
    { timestamps: true }
)

// Prevent model overwrite on hot reloads in Next.js
export default models.ProductCategory ||
    model("ProductCategory", ProductCategorySchema)
