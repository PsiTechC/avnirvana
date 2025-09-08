import { Schema, model, models } from "mongoose"

const CompanySchema = new Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  zipCode: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  website: { type: String, trim: true },
  gstin: { type: String, trim: true },
  description: { type: String, trim: true },
}, { timestamps: true })

export default models.Company || model("Company", CompanySchema)
