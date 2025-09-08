// components/quotations/quotation-pdf.tsx
"use client"

import * as React from "react"

export type QuotationItem = {
    id?: string
    _id?: string
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    total?: number
    imageUrl?: string
    description?: string
    specification?: string
}

export type Quotation = {
    id?: string
    _id?: string
    quotationNumber: string
    dealerName?: string
    dealerId?: string
    contactPerson?: string
    email?: string
    phone?: string
    status: "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired"
    createdDate?: string
    createdAt?: string
    validUntil: string
    items: QuotationItem[]
    subtotal?: number
    tax?: number
    discount?: number
    total?: number
    notes?: string
}

function toINR(n: number | string | undefined) {
    const v = Number(n || 0)
    return `Rs ${v.toFixed(2)}`
}

function toDate(d?: string) {
    if (!d) return "—"
    const dt = new Date(d)
    return Number.isFinite(dt.getTime()) ? dt.toLocaleDateString() : "—"
}

export default function QuotationPDF({
    quotation,
    company = {
        name: "Your Company Pvt. Ltd.",
        address: "Street, City, State - ZIP",
        phone: "+91-00000 00000",
        email: "info@company.com",
        gstin: "GSTIN: 00ABCDE0000Z0Z",
        logoUrl: "/avLogo.png",
    },
    coverImage = "",
    closingImage = "",
    aboutImage = "",
    proposalNote = "Thank you for considering our proposal. We are pleased to present our quotation for your review.",
    closingNote = "We look forward to working with you. Please contact us for any queries.",
    aboutText = "We are a leading company in our industry, committed to quality and customer satisfaction.",
}: {
    quotation: Quotation
    company?: {
        name: string
        address?: string
        phone?: string
        email?: string
        gstin?: string
        logoUrl?: string
    }
    coverImage?: string
    closingImage?: string
    aboutImage?: string
    proposalNote?: string
    closingNote?: string
    aboutText?: string
}) {
    // Derive money fields safely if backend didn’t pre-calc
    const [enrichedItems, setEnrichedItems] = React.useState<any[]>([]);

    React.useEffect(() => {
        let cancelled = false;
        async function enrichItems() {
            if (!quotation.items || quotation.items.length === 0) {
                setEnrichedItems([]);
                return;
            }
            // Fetch product details for each item
            const promises = quotation.items.map(async (it: any) => {
                let imageUrl = it.imageUrl;
                let specification = it.specification;
                if (it.productId) {
                    try {
                        const res = await fetch(`/api/products/${it.productId}`);
                        if (res.ok) {
                            const prod = (await res.json()).data;
                            imageUrl = prod.mainImage || imageUrl;
                            specification = prod.specification || specification;
                        }
                    } catch {}
                }
                // If imageUrl is a relative path, convert to absolute
                if (imageUrl && typeof imageUrl === "string" && imageUrl.startsWith("/")) {
                    imageUrl = window.location.origin + imageUrl;
                }
                // Proxy fetch and convert to base64
                let base64Image = null;
                if (imageUrl) {
                    try {
                        const proxied = `/api/proxy?url=${encodeURIComponent(imageUrl)}`;
                        const res = await fetch(proxied);
                        const blob = await res.blob();
                        base64Image = await new Promise((resolve) => {
                            const reader = new window.FileReader();
                            reader.onloadend = () => resolve(reader.result?.toString() || "");
                            reader.readAsDataURL(blob);
                        });
                    } catch {}
                }
                return {
                    ...it,
                    imageUrl: base64Image || "",
                    specification,
                };
            });
            const results = await Promise.all(promises);
            if (!cancelled) setEnrichedItems(results);
        }
        enrichItems();
        return () => { cancelled = true; };
    }, [quotation.items]);

    const items = enrichedItems.length > 0 ? enrichedItems : quotation.items ?? [];
    const subtotal =
        typeof quotation.subtotal === "number"
            ? quotation.subtotal
            : items.reduce((s, it) => s + (Number(it.total ?? it.quantity * it.unitPrice) || 0), 0)
    const tax = typeof quotation.tax === "number" ? quotation.tax : subtotal * 0.18
    const discount = Number(quotation.discount || 0)
    const total =
        typeof quotation.total === "number" ? quotation.total : Math.max(0, subtotal + tax - discount)
    const createdIso = quotation.createdAt || quotation.createdDate

    // Helper for page break
    const pageBreak = { 'pageBreakAfter': 'always' } as React.CSSProperties

    // Helper: render a header for each page
    const renderHeader = (heading: string) => (
        <div className="pdf-header" style={{width: '90%', margin: '0 auto', textAlign: 'center'}}>
            <div className="header-content" style={{justifyContent: 'center', alignItems: 'center', display: 'flex', width: '100%'}}>
                <div className="header-logo" style={{padding: '8px'}}>
                    {company.logoUrl && (
                        <img src={company.logoUrl} alt="Logo" className="h-20 w-60 object-contain mx-auto" />
                    )}
                </div>
                <div className="header-title" style={{flex: '1', textAlign: 'right', fontSize: '1.5rem', fontWeight: 500}}>{heading}</div>
            </div>
            <hr style={{border: 'none', borderTop: '5px solid #0400ff', margin: '2px 0', width: '100%'}} />
            <hr style={{border: 'none', borderTop: '5px solid #3168ff', margin: '2px 0', width: '100%'}} />
        </div>
    );

    return (
        <div>
            {/* Print Button */}
            <div className="no-print flex justify-end mb-4">
                <button
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-blue-700 text-white font-semibold rounded shadow hover:bg-blue-800 transition"
                >
                    Print
                </button>
            </div>
            <div id={`quotation-pdf-${quotation._id ?? quotation.id ?? quotation.quotationNumber}`}
                className="bg-white text-[#111] w-[794px] mx-auto print:w-[794px] print:p-0 border rounded-lg"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            {/* Page 1: Cover */}
            <div style={{ pageBreakAfter: 'always' }} className="relative w-full h-[1000px] flex flex-col">
                {/* {renderHeader("Quotation Cover")} */}
                <div className="flex-1 flex items-center justify-center">
                    {coverImage && (
                        <img src={coverImage} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    )}
                    <div className="relative z-10 text-center w-full">
                        <div className="text-4xl font-bold mb-4">Quotation</div>
                        <div className="text-2xl font-semibold">{quotation.quotationNumber}</div>
                        <div className="text-lg mt-2">Date: {toDate(createdIso)}</div>
                    </div>
                </div>
            </div>

            {/* Page 2: Proposal Note */}
            <div style={{ pageBreakAfter: 'always' }} className="flex flex-col h-[1000px]">
                {renderHeader("Proposal Note")}
                <div className="flex-1 flex flex-col items-center justify-center p-16">
                    {/* <div className="text-3xl font-bold mb-8">Proposal Note</div> */}
                    <div className="text-lg max-w-2xl text-center whitespace-pre-line">{proposalNote}</div>
                </div>
            </div>

            {/* Page 3: Product Details (with images, description, specification)
            {items.length > 0 && (
                items.reduce((acc: React.ReactElement[], item, idx) => {
                    // For every 3 products, start a new page
                    if (idx % 3 === 0) {
                        acc.push(
                            <div key={`product-details-page-${Math.floor(idx/3)}`}
                                style={{ pageBreakAfter: 'always' }}
                                className="flex flex-col h-[1000px]">
                                {renderHeader("Product Details")}
                                <div className="flex-1 grid grid-cols-1 gap-8 p-8">
                                    {items.slice(idx, idx+3).map((prod, j) => (
                                        <div key={prod._id ?? prod.id ?? j} className="flex flex-row gap-6 border rounded-lg bg-gray-50 p-4 shadow-sm">
                                            {prod.imageUrl && (
                                                <img src={prod.imageUrl} alt={prod.productName} className="w-40 h-40 object-contain rounded bg-white border" />
                                            )}
                                            <div className="flex-1 flex flex-col gap-2">
                                                <div className="font-bold text-lg">{prod.productName}</div>
                                                {prod.description && (
                                                    <div className="text-sm text-gray-700 whitespace-pre-line">{prod.description}</div>
                                                )}
                                                {prod.specification && (
                                                    <div className="text-xs text-gray-500 whitespace-pre-line"><span className="font-semibold">Specification:</span> {prod.specification}</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    }
                    return acc;
                }, [])
            )} */}

            {/* Page 4: Product Details (Image right, spec/price left) */}
            <div style={{ pageBreakAfter: 'always' }} className="flex flex-col h-[1000px]">
                {renderHeader("Product Details")}
                <div className="flex-1 flex flex-col gap-8 p-8">
                    {items.map((it, i) => (
                        <div key={it._id ?? it.id ?? i} className="flex flex-row items-center border rounded-lg bg-gray-50 p-6 shadow-sm gap-8">
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="font-bold text-lg mb-1">{it.productName}</div>
                                {it.productId && (
                                    <div className="text-[11px] text-gray-500 mb-2">ID: {it.productId}</div>
                                )}
                                <div className="text-xs text-gray-700 whitespace-pre-line mb-2">
                                    <span className="font-semibold">Specification:</span> {it.specification || <span className="text-muted-foreground">—</span>}
                                </div>
                                <div className="text-base font-semibold text-blue-700">Price: {toINR(it.unitPrice)}</div>
                            </div>
                            <div style={{ minWidth: 180, maxWidth: 220, textAlign: "center" }}>
                                {it.imageUrl && typeof it.imageUrl === "string" && it.imageUrl.startsWith("data:image") ? (
                                    <img src={it.imageUrl} alt={it.productName} style={{ width: "180px", height: "180px", objectFit: "contain", borderRadius: "16px", background: "#fff", border: "1px solid #e5e7eb", display: "block", margin: "0 auto" }} onError={e => { e.currentTarget.src = it.mainImage || ""; }} />
                                ) : it.mainImage ? (
                                    <img src={it.mainImage} alt={it.productName} style={{ width: "180px", height: "180px", objectFit: "contain", borderRadius: "16px", background: "#fff", border: "1px solid #e5e7eb", display: "block", margin: "0 auto" }} />
                                ) : (
                                    <span className="text-muted-foreground">—</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Page 5: Product Details + Calculation Information (Combined) */}
            <div style={{ pageBreakAfter: 'always' }} className="flex flex-col h-[1000px]">
                {renderHeader("Product Details & Calculation")}
                <div className="flex-1 flex flex-col gap-8 p-8">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-y">
                                    <th className="text-left px-3 py-2 w-10">#</th>
                                    <th className="text-left px-3 py-2">Product</th>
                                    <th className="text-right px-3 py-2 w-24">Qty</th>
                                    <th className="text-right px-3 py-2 w-36">Unit Price</th>
                                    <th className="text-right px-3 py-2 w-36">Line Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((it, i) => {
                                    const qty = Number(it.quantity) || 0
                                    const unit = Number(it.unitPrice) || 0
                                    const line = Number(it.total ?? qty * unit) || 0
                                    return (
                                        <tr key={it._id ?? it.id ?? i} className="border-b">
                                            <td className="px-3 py-2 align-top">{i + 1}</td>
                                            <td className="px-3 py-2">
                                                <div className="font-medium">{it.productName}</div>
                                                {it.productId && (
                                                    <div className="text-[11px] text-gray-500">ID: {it.productId}</div>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-right">{qty}</td>
                                            <td className="px-3 py-2 text-right">{toINR(unit)}</td>
                                            <td className="px-3 py-2 text-right">{toINR(line)}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="w-full max-w-md self-end">
                        <table className="w-full border border-gray-300 rounded bg-gray-50 text-sm">
                            <tbody>
                                <tr className="border-b">
                                    <td className="px-4 py-2 font-medium">Subtotal</td>
                                    <td className="px-4 py-2 text-right">{toINR(subtotal)}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="px-4 py-2 font-medium">Tax</td>
                                    <td className="px-4 py-2 text-right">{toINR(tax)}</td>
                                </tr>
                                {discount > 0 && (
                                    <tr className="border-b">
                                        <td className="px-4 py-2 font-medium">Discount</td>
                                        <td className="px-4 py-2 text-right">- {toINR(discount)}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td className="px-4 py-3 font-semibold bg-gray-100 rounded-bl">Grand Total</td>
                                    <td className="px-4 py-3 text-right font-semibold bg-gray-100 rounded-br">{toINR(total)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Page 5: Closing Note */}
            <div style={{ pageBreakAfter: 'always' }} className="flex flex-col h-[1000px]">
                {renderHeader("Closing Note")}
                {/* Top half: image with margin */}
                <div className="flex items-center justify-center" style={{height: 500}}>
                    {closingImage && (
                        <img src={closingImage} alt="Closing" className="object-cover rounded-lg" style={{width: '90%', height: '90%', margin: '0 auto', boxShadow: '0 2px 12px rgba(0,0,0,0.08)'}} />
                    )}
                </div>
                {/* Bottom half: closing note */}
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    {/* <div className="text-3xl font-bold mb-8">Closing Note</div> */}
                    <div className="text-lg max-w-2xl mx-auto whitespace-pre-line">{closingNote}</div>
                </div>
            </div>

            {/* Page 6: About Us */}
            <div className="flex flex-col h-[1000px]">
                {renderHeader("About Us")}
                <div className="flex-1 relative flex items-center justify-center">
                    {((typeof (quotation as any)?.template !== "undefined" && (quotation as any)?.template?.aboutUs?.aboutUsImage) || aboutImage) && (
                        <img src={(quotation as any)?.template?.aboutUs?.aboutUsImage || aboutImage} alt="About Us" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    )}
                    <div className="relative z-10 text-center w-full">
                        {/* <div className="text-3xl font-bold mb-8">About Us</div> */}
                        <div className="text-lg max-w-2xl mx-auto whitespace-pre-line">{aboutText}</div>
                    </div>
                </div>
            </div>

            {/* Print helpers and header/footer styles */}
                        <style>{`
                @media print {
                    @page { size: A4; margin: 16mm; }
                    .no-print { display: none !important; }
                    html, body { background: #fff; }
                }
                .pdf-header {
                    width: 90%;
                    margin-bottom: 18px;
                }
                .header-content {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                }
                .header-logo {
                    flex: 0 0 auto;
                }
                .header-title {
                    flex: 1 1 auto;
                    text-align: right;
                    font-size: 1.5rem;
                    font-weight: 500;
                    letter-spacing: 0.02em;
                }
            `}</style>
            </div>
        </div>
    )
}
