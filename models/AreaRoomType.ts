// import { Schema, model, models } from "mongoose";

// const AreaRoomTypeSchema = new Schema({
//     name: { type: String, required: true, unique: true },
// }, { timestamps: true });

// export default models.AreaRoomType || model("AreaRoomType", AreaRoomTypeSchema);


import { Schema, model, models } from "mongoose"

const AreaRoomTypeSchema = new Schema(
    {
        name: { type: String, required: true, trim: true, index: true },
        description: { type: String },
    },
    { timestamps: true }
)

// Create or reuse the model (important in Next.js hot-reload)
export default models.AreaRoomType || model("AreaRoomType", AreaRoomTypeSchema)
