// import { Schema, model, models } from "mongoose";

// const ProductFunctionSchema = new Schema({
//     name: { type: String, required: true, unique: true },
// }, { timestamps: true });

// export default models.ProductFunction || model("ProductFunction", ProductFunctionSchema);
import { Schema, model, models } from "mongoose";

const ProductFunctionSchema = new Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        description: { type: String, trim: true },
    },
    { timestamps: true }
);

// Add indexes for common queries
ProductFunctionSchema.index({ name: 1 });

export default models.ProductFunction || model("ProductFunction", ProductFunctionSchema);
