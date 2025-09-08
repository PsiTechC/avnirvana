// models/Dealer.ts
import { Schema, model, models } from "mongoose"

const DealerSchema = new Schema(
    {
        name: String,
        contactPerson: String,
        email: String,
        phone: String,
        address: String,
        city: String,
        state: String,
        zipCode: String,
        status: String,       // "Active" | "Inactive"
        dealerType: String,   // "Authorized" | "Premium" | "Standard"
        territory: String,
        logoUrl: String,      // public path to uploaded logo (e.g. /uploads/xyz.png)
        registrationDate: { type: Date, default: Date.now },
    },
    { timestamps: true }
)

export default models.Dealer || model("Dealer", DealerSchema)
