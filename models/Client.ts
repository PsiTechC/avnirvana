import { Schema, model, models } from "mongoose"

const ClientSchema = new Schema({
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    zipCode: { type: String },
    notes: { type: String },
}, { timestamps: true })

export default models.Client || model("Client", ClientSchema)
