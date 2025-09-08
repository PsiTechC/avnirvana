import mongoose from "mongoose";
export const isObjectId = (id: string) => mongoose.Types.ObjectId.isValid(id);
