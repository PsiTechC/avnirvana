import { z } from "zod";

export const BrandSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    logoUrl: z.string().optional(),
    websiteUrl: z.string().optional(),
    status: z.enum(["active", "inactive"]).default("active"),
    productOrder: z.array(z.string()).optional(),
});

export const OtherBrandSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    websiteUrl: z.string().optional(),
    status: z.enum(["active", "inactive"]).default("active"),
})


export const AreaRoomTypeSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
})

export const DealerSchema = z.object({
    name: z.string().min(2),
    contactPerson: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    status: z.enum(["Active", "Inactive"]).default("Active"),
    dealerType: z.enum(["Authorized", "Premium", "Standard"]).default("Standard"),
    territory: z.string().optional(),
    logo: z.string().url().optional(),
});

export const ProductCategorySchema = z.object({
    name: z.string().min(2),
    description: z.string().max(1500).optional(),
});
export const ProductFunctionSchema = z.object({
    name: z.string().min(2),
    description: z.string().max(1500).optional(),
});


export const ProductSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    specification: z.string().optional(),
    brandId: z.string(),
    categoryIds: z.array(z.string()),
    functionIds: z.array(z.string()),
    price: z.coerce.number().nonnegative(),
    isPOR: z.boolean().default(false),
    imageUrl: z.string().url().optional(),
    //sku: z.string().optional(),
    status: z.enum(["active", "inactive"]).default("active"),
    //stockLevel: z.coerce.number().int().nonnegative().default(0),
    gstPercent: z.number().min(0).max(100).default(0),
    isNewProduct: z.boolean().default(false),
});



// Zod validation for quotations removed as per user request.