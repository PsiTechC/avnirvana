// // types/quotation-template.ts
// export type TemplateText = {
//     html?: string;        // stored HTML (from your editor) — safer + flexible
//     markdown?: string;    // optional, if you use md editor
// };

// export type TemplateCompany = {
//     name: string;
//     address?: string;
//     phone?: string;
//     email?: string;
//     gstin?: string;
//     logoUrl?: string;
// };

// export interface QuotationTemplate {
//     _id: string;
//     name: string;
//     company?: TemplateCompany;

//     // Page 1 (cover)
//     cover: {
//         bgImageUrl?: string;
//         overlay?: string;      // e.g. "linear-gradient(...)"
//         titleColor?: string;   // e.g. "#fff"
//         subtitleColor?: string;
//         accentColor?: string;
//         showLogo?: boolean;
//         fontFamily?: string;   // optional override
//     };

//     // Page 2–6 texts
//     proposalNote?: TemplateText; // page 2
//     closingNote?: TemplateText;  // page 5
//     aboutUs?: TemplateText;      // page 6

//     // Product page options (page 3)
//     productPage?: {
//         cardStyle?: "minimal" | "shadow" | "border";
//         showSku?: boolean;
//         showShortDesc?: boolean;
//     };

//     // Calculation page (page 4)
//     calcPage?: {
//         tableStyle?: "zebra" | "bordered";
//         currency?: "INR" | "USD";
//     };

//     // Common page layout
//     page?: {
//         size?: "A4";           // keep it A4 for print
//         topPadding?: number;   // px
//         bottomPadding?: number;
//         leftPadding?: number;
//         rightPadding?: number;
//     };

//     updatedAt?: string;
//     createdAt?: string;
// }


export type TemplateText = {
    html?: string
    markdown?: string
}

export type TemplateCompany = {
    name: string
    address?: string
    phone?: string
    email?: string
    gstin?: string
    logoUrl?: string
}

export interface QuotationTemplate {
    _id: string
    name: string
    company?: TemplateCompany

    cover: {
        bgImageUrl?: string
        overlay?: string          // e.g. "linear-gradient(180deg, rgba(0,0,0,.45), rgba(0,0,0,.45))"
        titleColor?: string       // default #fff
        subtitleColor?: string
        accentColor?: string
        showLogo?: boolean
        fontFamily?: string
    }

    proposalNote?: TemplateText  // page 2
    closingNote?: TemplateText   // page 5
    aboutUs?: TemplateText       // page 6

    productPage?: {
        cardStyle?: "minimal" | "shadow" | "border"
        showSku?: boolean
        showShortDesc?: boolean
    }

    calcPage?: {
        tableStyle?: "zebra" | "bordered"
        currency?: "INR" | "USD"
    }

    page?: {
        size?: "A4"
        topPadding?: number
        bottomPadding?: number
        leftPadding?: number
        rightPadding?: number
    }

    updatedAt?: string
    createdAt?: string
}
