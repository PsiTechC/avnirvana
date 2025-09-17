

"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { List, FileDown } from "lucide-react"
// Remove static imports for jsPDF, autoTable, XLSX
import { Input } from "@/components/ui/input"

type BrandOpt = { id: string; name: string }
type ProductRow = {
    _id: string
    name: string
    price?: number
    isPOR?: boolean
    status?: "active" | "inactive"
    brandId?: string | { _id?: string; name?: string }
    mainImage?: string
    specification?: string
    gstPercent?: number
}

type BrandDetails = { _id: string; name: string; logoUrl?: string; websiteUrl?: string };
type CompanyInfo = {
    logoUrl: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
    email: string;
    website?: string;
    gstin?: string;
    description?: string;
};

export default function ProductPriceListPage() {
    function extractBrandId(b?: ProductRow["brandId"]) {
        if (!b) return ""
        if (typeof b === "string") return b
        return b._id || ""
    }

    // --- Export Handlers ---
    // --- Brand/Company Info for Export Header ---
    const [brandDetails, setBrandDetails] = useState<BrandDetails | null>(null);
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
    const [effectiveDate, setEffectiveDate] = useState<string>("");


    // Helper to fetch brand/company info only when exporting
    async function fetchExportHeaderInfo(brandId: string) {
        let brand: BrandDetails | null = null;
        let company: CompanyInfo | null = null;
        try {
            if (brandId) {
                const res = await fetch(`/api/brands/${brandId}`);
                if (res.ok) brand = (await res.json()).data;
            }
        } catch { }
        try {
            const res = await fetch('/api/company');
            if (res.ok) company = (await res.json()).data;
        } catch { }
        setBrandDetails(brand);
        setCompanyInfo(company);
        return { brand, company };
    }

    const formatINR = (n?: number) =>
        typeof n === "number" ? n.toLocaleString("en-IN") : "";

    // ✅ New: “Rs ” prefix + Indian grouping
    const formatRs = (n?: number) =>
        typeof n === "number" ? `Rs ${n.toLocaleString("en-IN")}` : "";

    const handleExportExcel = async () => {
        // Fetch header info just-in-time
        const { brand, company } = await fetchExportHeaderInfo(selectedBrandId);
        // @ts-ignore
        const XPop = await import("xlsx-populate/browser/xlsx-populate-no-encryption");
        // Preload images as base64
        const imagePromises = activeProducts.map(async (p) => {
            if (p.mainImage) {
                try {
                    let url = p.mainImage;
                    if (url.startsWith("/")) {
                        url = window.location.origin + url;
                    }
                    // Proxy image fetch to avoid CORS
                    const proxied = `/api/proxy?url=${encodeURIComponent(url)}`;
                    const res = await fetch(proxied);
                    const blob = await res.blob();
                    return await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                } catch {
                    return null;
                }
            }
            return null;
        });
        const images = await Promise.all(imagePromises);

        // ✅ Use formatted string for MRP column
        const rows = activeProducts.map((p, i) => [
            images[i],
            p.name,
            p.specification || "",
            typeof p.gstPercent === "number" ? p.gstPercent : "",
            p.isPOR ? "POR" : formatRs(p.price)
        ]);

        const workbook = await XPop.default.fromBlankAsync();
        const sheet = workbook.sheet(0);

        // --- Custom Header: Brand Logo (left), Company Info (right) ---
        let headerRow = 1;
        let headerHeight = 40;
        if (brand?.logoUrl || company) {
            // Brand logo (left)
            if (brand?.logoUrl) {
                try {
                    let logoUrl = brand.logoUrl;
                    if (logoUrl.startsWith("/")) logoUrl = window.location.origin + logoUrl;
                    const proxied = `/api/proxy?url=${encodeURIComponent(logoUrl)}`;
                    const res = await fetch(proxied);
                    const blob = await res.blob();
                    const base64 = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result?.toString().split(",")[1] || "");
                        reader.readAsDataURL(blob);
                    });
                    if (base64) {
                        const imgId = await workbook.addImage({ base64, extension: "png" });
                        sheet.image(imgId, {
                            anchor: sheet.cell(headerRow, 1),
                            width: 40,
                            height: headerHeight,
                            editAs: "oneCell"
                        });
                    }
                } catch { }
            }
            // Company info (right, as text)
            if (company) {
                const info = [
                    company.address + ", " + company.city + ", " + company.state + " " + company.zipCode,
                    company.country,
                    `Phone: ${company.phone}  Email: ${company.email}`,
                    company.website ? `Website: ${company.website}` : "",
                    company.gstin ? `GSTIN: ${company.gstin}` : "",
                ].filter(Boolean).join("\n");
                sheet.cell(headerRow, 5).value(info).style({ bold: true, fontSize: 11 });
            }
            sheet.range(headerRow, 2, headerRow, 5).merged(true);
            sheet.row(headerRow).height(headerHeight);
        }

        // Set table headers below custom header
        const tableHeaderRow = headerRow + 1;
        ["Image", "Name", "Specification", "GST %", "MRP"].forEach((h, idx) => {
            sheet.cell(tableHeaderRow, idx + 1).value(h);
        });

        // Fill rows
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            for (let j = 0; j < row.length; j++) {
                if (j === 0 && row[0] && typeof row[0] === "string" && row[0].startsWith("data:image")) {
                    const base64 = row[0].split(",")[1];
                    const isPng = row[0].includes("png");
                    const extension = isPng ? "png" : "jpeg";
                    try {
                        const imgId = await workbook.addImage({ base64, extension });
                        sheet.image(imgId, {
                            anchor: sheet.cell(i + tableHeaderRow + 1, j + 1),
                            width: 40,
                            height: 40,
                            editAs: "oneCell"
                        });
                    } catch (e) { }
                }
                sheet.cell(i + tableHeaderRow + 1, j + 1).value(j === 0 ? "" : row[j]);
            }
        }

        // Adjust column width for image
        sheet.column(1).width(8);

        // Download
        const blob = await workbook.outputAsync();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "price-list.xlsx";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    };

    const handleExportPDF = async () => {
        const { brand, company } = await fetchExportHeaderInfo(selectedBrandId);
        // @ts-ignore
        const jsPDF = (await import("jspdf")).default;
        // @ts-ignore
        const autoTable = (await import("jspdf-autotable")).default;

        const doc = new jsPDF({ orientation: "landscape" });

        // ---------- Layout constants ----------
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const thinMargin = 8;
        const headerY = 6;
        const brandLogoW = 32, brandLogoH = 24;
        const avLogoW = 50, avLogoH = 16;
        const headerBlockH = Math.max(brandLogoH, avLogoH) + 12;
        const footerH = 8;

        // Image cell box + min row height (prevents overlap on empty rows)
        const IMG_PAD = 2;
        const IMG_BOX_H = 42;
        const MIN_ROW_H = IMG_BOX_H + IMG_PAD * 2;

        // const effectiveStr = new Date().toLocaleDateString("en-GB");
        const effectiveStr = effectiveDate
            ? new Date(effectiveDate).toLocaleDateString("en-GB")
            : new Date().toLocaleDateString("en-GB"); // fallback to today if not set


        // ---------- helper for base64 ----------
        async function toB64(u: string) {
            const res = await fetch(`/api/proxy?url=${encodeURIComponent(u)}`);
            const blob = await res.blob();
            return await new Promise<string>((resolve) => {
                const r = new FileReader();
                r.onloadend = () => resolve((r.result as string) || "");
                r.readAsDataURL(blob);
            });
        }

        // ---------- preload logos ----------
        let brandLogoB64: string | null = null;
        if (brand?.logoUrl) {
            let u = brand.logoUrl;
            if (u.startsWith("/")) u = window.location.origin + u;
            try { brandLogoB64 = await toB64(u); } catch { }
        }
        let avLogoB64: string | null = null;
        try {
            let u = "/avLogo.png";
            if (u.startsWith("/")) u = window.location.origin + u;
            avLogoB64 = await toB64(u);
        } catch { }

        // ---------- company info lines ----------
        const infoLines = company
            ? [
                `${company.address}, ${company.city}, ${company.state} ${company.zipCode}`,
                company.country,
                `Phone: ${company.phone}  Email: ${company.email}`,
                company.website ? `Website: ${company.website}` : "",
                company.gstin ? `GSTIN: ${company.gstin}` : "",
            ].filter(Boolean)
            : [];

        // ---------- preload product images ----------
        const productImages = await Promise.all(
            activeProducts.map(async (p) => {
                if (!p.mainImage) return null;
                try {
                    let url = p.mainImage;
                    if (url.startsWith("/")) url = window.location.origin + url;
                    return await toB64(url);
                } catch { return null; }
            })
        );

        // ✅ Use formatted string for MRP column
        const rows = activeProducts.map((p, i) => [
            i+1,
            "", // image cell content left empty
            `${p.name}\n${p.specification || ""}`, // Name + Spec in one cell
            typeof p.gstPercent === "number" ? p.gstPercent : "",
            p.isPOR ? "POR" : formatRs(p.price)
        ]);

        // ---------- columns (image | name | spec | gst | mrp) ----------
        const availableWidth = pageWidth - 2 * thinMargin;
        const base = [20, 60, 90, 24, 32]; 
        const sum = base.reduce((a, b) => a + b, 0);
        const scale = availableWidth / sum;
        const colWidths = base.map(w => w * scale);

        // ---------- title rows ----------
        const titleRow = [{ content: "Price List", colSpan: 5, styles: { halign: "center", fontStyle: "bold", fontSize: 14, textColor: [30, 144, 255] } }];
        const subtitleRow = [{
            content: `[Effective ${effectiveStr}. This pricelist supersedes all previous pricelists.]`,
            colSpan: 5,
            styles: { halign: "center", fontSize: 10, textColor: [204, 0, 0] }
        }];

        // autoTable(doc, {
        //     head: [
        //         titleRow as any,
        //         subtitleRow as any,
        //         ["Sr. No.", "Image", "Name & Specification", "GST %", "MRP"]
        //     ],
        //     body: rows as any[][],
        //     margin: { top: headerY + headerBlockH + 2, bottom: footerH + 4, left: thinMargin, right: thinMargin },
        //     theme: "grid",

        //     headStyles: {
        //         fillColor: [200, 200, 200],
        //         textColor: 0,
        //         fontStyle: "bold",
        //         halign: "center",
        //         valign: "middle",
        //         fontSize: 11,
        //         cellPadding: 4,
        //         lineWidth: 0.5,
        //         lineColor: [0, 0, 0], // black borders
        //     },
        //     styles: {
        //         fontSize: 10,
        //         cellPadding: 4,
        //         halign: "left",
        //         valign: "middle",
        //         overflow: "linebreak",
        //         lineWidth: 0.5,
        //         lineColor: [0, 0, 0], // black borders
        //     },
        //     bodyStyles: {
        //         minCellHeight: MIN_ROW_H,
        //     },
        //     rowPageBreak: "avoid",

        //     columnStyles: {
        //         0: { cellWidth: colWidths[0], halign: "center" }, 
        //         1: { cellWidth: colWidths[1], halign: "center", valign: "middle" }, // Image                                    // Name (slightly narrower)
        //         2: { cellWidth: colWidths[2], fontSize: 9 },                         // Name Specification smaller font  ← CHANGED
        //         3: { cellWidth: colWidths[3], halign: "center" },                    // GST
        //         4: { cellWidth: colWidths[4], halign: "center" },                    // MRP wider so it won't wrap  ← CHANGED
        //     },

        //     didDrawPage: (data) => {
        //         // --- Brand logo ---
        //         if (brandLogoB64) {
        //             try {
        //                 doc.addImage(brandLogoB64, "PNG", thinMargin, headerY, brandLogoW, brandLogoH);
        //             } catch { }
        //         }

        //         // --- AV logo + company info ---
        //         const INFO_BLOCK_W = 110;
        //         const infoLeftX = pageWidth - thinMargin - INFO_BLOCK_W;
        //         if (avLogoB64) {
        //             try {
        //                 doc.addImage(avLogoB64, "PNG", infoLeftX, headerY, avLogoW, avLogoH);
        //             } catch { }
        //         }

        //         if (infoLines.length) {
        //             doc.setFontSize(8);
        //             doc.setFont("sans", "normal");

        //             const startY = headerY + avLogoH + 4;
        //             let cursorY = startY;

        //             infoLines.forEach((line, idx) => {
        //                 let y = cursorY + idx * 4;

        //                 // Detect email
        //                 if (line.includes("Email:")) {
        //                     const parts = line.split("Email:");
        //                     const leftPart = parts[0].trim();
        //                     const email = parts[1]?.trim();

        //                     // Print left part normally
        //                     if (leftPart) {
        //                         doc.setTextColor(0, 0, 0);
        //                         doc.text(leftPart, infoLeftX, y, { align: "left" });
        //                     }

        //                     // Print email in blue + add link
        //                     if (email) {
        //                         const emailX = doc.getTextWidth(leftPart + " ") + infoLeftX;
        //                         doc.setTextColor(0, 0, 255);
        //                         doc.text(`Email: ${email}`, emailX, y, { align: "left" });
        //                         doc.link(emailX, y - 3, doc.getTextWidth(email), 6, { url: `mailto:${email}` });
        //                     }
        //                 }
        //                 // Detect website
        //                 else if (line.startsWith("Website:")) {
        //                     const website = line.replace("Website:", "").trim();
        //                     doc.setTextColor(0, 0, 255);
        //                     doc.text(`Website: ${website}`, infoLeftX, y, { align: "left" });
        //                     doc.link(infoLeftX + doc.getTextWidth("Website: "), y - 3, doc.getTextWidth(website), 6, {
        //                         url: website.startsWith("http") ? website : `https://${website}`,
        //                     });
        //                 }
        //                 // Default (normal black text)
        //                 else {
        //                     doc.setTextColor(0, 0, 0);
        //                     doc.text(line, infoLeftX, y, { align: "left" });
        //                 }
        //             });
        //         }

        //         // --- Footer stays as is ---
        //         const footerHeight = 12;
        //         const footerTop = pageHeight - footerHeight;
        //         doc.setFillColor(200, 200, 200);
        //         doc.rect(0, footerTop, pageWidth, footerHeight, "F");

        //         doc.setFontSize(9);
        //         doc.setFont("helvetica", "bold");
        //         doc.setTextColor(204, 0, 0);
        //         doc.text(
        //             `[Effective ${effectiveStr}. This pricelist supersedes all previous pricelists.]`,
        //             pageWidth / 2,
        //             footerTop + footerHeight / 2 + 2,
        //             { align: "center" }
        //         );

        //         doc.setFont("helvetica", "bold");
        //         doc.setTextColor(0, 0, 0);
        //         doc.text(`Page ${data.pageNumber}`, pageWidth - thinMargin, footerTop + footerHeight / 2 + 2, {
        //             align: "right",
        //         });
        //     },



            // //////////////Original image handler//////////////
            // didDrawCell: (cell) => {
            //     if (cell.section === "body" && cell.column.index === 1) {
            //         const img = productImages[cell.row.index];
            //         if (!img) return;

            //         const cw = cell.cell.width;
            //         const ch = cell.cell.height;

            //         const boxW = cw - 2 * IMG_PAD;
            //         const boxH = IMG_BOX_H;

            //         const maxDrawableH = Math.max(0, ch - 2 * IMG_PAD);
            //         const drawH = Math.min(boxH, maxDrawableH);
            //         const drawW = boxW;

            //         const x = cell.cell.x + (cw - drawW) / 2;
            //         const y = cell.cell.y + (ch - drawH) / 2;

            //         try { doc.addImage(img, "JPEG", x, y, drawW, drawH); }
            //         catch { try { doc.addImage(img, "PNG", x, y, drawW, drawH); } catch { } }
            //     }
            // },
        // });



        autoTable(doc, {
            head: [
                titleRow as any,
                subtitleRow as any,
                ["Sr. No.", "Image", "Name & Specification", "GST %", "MRP"]
            ],
            body: rows as any[][],
            margin: { top: headerY + headerBlockH + 2, bottom: footerH + 4, left: thinMargin, right: thinMargin },
            theme: "grid",

            headStyles: {
                fillColor: [200, 200, 200],
                textColor: 0,
                fontStyle: "bold",
                halign: "center",
                valign: "middle",
                fontSize: 11,
                cellPadding: 4,
                lineWidth: 0.5,
                lineColor: [0, 0, 0],
            },
            styles: {
                fontSize: 10,
                cellPadding: 4,
                halign: "left",
                valign: "middle",
                overflow: "linebreak",
                lineWidth: 0.5,
                lineColor: [0, 0, 0],
            },
            bodyStyles: {
                minCellHeight: MIN_ROW_H,
            },
            rowPageBreak: "avoid",

            columnStyles: {
                0: { cellWidth: colWidths[0], halign: "center" },
                1: { cellWidth: colWidths[1], halign: "center", valign: "middle" },
                2: { cellWidth: colWidths[2], fontSize: 9 },
                3: { cellWidth: colWidths[3], halign: "center" },
                4: { cellWidth: colWidths[4], halign: "center" },
            },

                didDrawPage: (data) => {
                    // --- Brand logo ---
                    if (brandLogoB64) {
                        try {
                            doc.addImage(brandLogoB64, "PNG", thinMargin, headerY, brandLogoW, brandLogoH);
                        } catch { }
                    }

                    // --- AV logo + company info ---
                    const INFO_BLOCK_W = 110;
                    const infoLeftX = pageWidth - thinMargin - INFO_BLOCK_W;
                    if (avLogoB64) {
                        try {
                            doc.addImage(avLogoB64, "PNG", infoLeftX, headerY, avLogoW, avLogoH);
                        } catch { }
                    }

                    if (infoLines.length) {
                        doc.setFontSize(8);
                        doc.setFont("sans", "normal");

                        const startY = headerY + avLogoH + 4;
                        let cursorY = startY;

                        infoLines.forEach((line, idx) => {
                            let y = cursorY + idx * 4;

                            // Detect email
                            if (line.includes("Email:")) {
                                const parts = line.split("Email:");
                                const leftPart = parts[0].trim();
                                const email = parts[1]?.trim();

                                // Print left part normally
                                if (leftPart) {
                                    doc.setTextColor(0, 0, 0);
                                    doc.text(leftPart, infoLeftX, y, { align: "left" });
                                }

                                // Print email in blue + add link
                                if (email) {
                                    const emailX = doc.getTextWidth(leftPart + " ") + infoLeftX;
                                    doc.setTextColor(0, 0, 255);
                                    doc.text(`Email: ${email}`, emailX, y, { align: "left" });
                                    doc.link(emailX, y - 3, doc.getTextWidth(email), 6, { url: `mailto:${email}` });
                                }
                            }
                            // Detect website
                            else if (line.startsWith("Website:")) {
                                const website = line.replace("Website:", "").trim();
                                doc.setTextColor(0, 0, 255);
                                doc.text(`Website: ${website}`, infoLeftX, y, { align: "left" });
                                doc.link(infoLeftX + doc.getTextWidth("Website: "), y - 3, doc.getTextWidth(website), 6, {
                                    url: website.startsWith("http") ? website : `https://${website}`,
                                });
                            }
                            // Default (normal black text)
                            else {
                                doc.setTextColor(0, 0, 0);
                                doc.text(line, infoLeftX, y, { align: "left" });
                            }
                        });
                    }

                    // --- Footer stays as is ---
                    const footerHeight = 12;
                    const footerTop = pageHeight - footerHeight;
                    doc.setFillColor(200, 200, 200);
                    doc.rect(0, footerTop, pageWidth, footerHeight, "F");

                    doc.setFontSize(9);
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(204, 0, 0);
                    doc.text(
                        `[Effective ${effectiveStr}. This pricelist supersedes all previous pricelists.]`,
                        pageWidth / 2,
                        footerTop + footerHeight / 2 + 2,
                        { align: "center" }
                    );

                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(0, 0, 0);
                    doc.text(`Page ${data.pageNumber}`, pageWidth - thinMargin, footerTop + footerHeight / 2 + 2, {
                        align: "right",
                    });
                },


            // --- Step 1: Split name + spec --- 1st version
            // didParseCell: (data) => {
            //     if (data.section === "body" && data.column.index === 2) {
            //         const raw = String(data.cell.raw || "");
            //         const [name, ...rest] = raw.split("\n");
            //         const spec = rest.join(" ").trim();
            //         // store them separately so we can draw later
            //         (data.cell as any).customName = name || "";
            //         (data.cell as any).customSpec = spec || "";
            //         // prevent default text
            //         data.cell.text = [""];
            //     }
            // },


            // --- Step 1: Split name + spec --- 2nd version
            // didParseCell: (data) => {
            //     if (data.section === "body" && data.column.index === 2) {
            //         const raw = String(data.cell.raw || "");
            //         const [name, ...rest] = raw.split("\n");
            //         const spec = rest.join(" ").trim();

            //         (data.cell as any).customName = name || "";
            //         (data.cell as any).customSpec = spec || "";

            //         // Estimate height for spec text
            //         const lineHeight = 5;
            //         const specHeight = doc.getTextDimensions(spec || "", {
            //             maxWidth: data.cell.width - 4,
            //         }).h;

            //         // Increase row height dynamically
            //         data.cell.height = 10 + specHeight;

            //         // Prevent default autoTable text
            //         data.cell.text = [""];
            //     }
            // },


            // --- Step 1: Split name + spec --- 3rd version (final)
            didParseCell: (data) => {
                if (data.section === "body" && data.column.index === 2) {
                    const raw = String(data.cell.raw || "");
                    const [name, ...rest] = raw.split("\n");
                    const spec = rest.join(" ").trim();

                    (data.cell as any).customName = name || "";
                    (data.cell as any).customSpec = spec || "";

                    // Estimate number of lines spec will take
                    const maxWidth = data.cell.width - 4;
                    const specLines = doc.splitTextToSize(spec, maxWidth);
                    const totalLines = (name ? 1 : 0) + specLines.length;

                    // Force row height based on number of lines
                    const lineHeight = 5;
                    data.cell.height = totalLines * lineHeight + 4;

                    // Prevent default text
                    data.cell.text = [""];
                }
            },


            // --- Step 2: Render with custom colors --- 1st version
            // didDrawCell: (cell) => {
            //     // Images (keep as-is)
            //     if (cell.section === "body" && cell.column.index === 1) {
            //         const img = productImages[cell.row.index];
            //         if (!img) return;
            //         const cw = cell.cell.width;
            //         const ch = cell.cell.height;
            //         const boxW = cw - 2 * IMG_PAD;
            //         const boxH = IMG_BOX_H;
            //         const maxDrawableH = Math.max(0, ch - 2 * IMG_PAD);
            //         const drawH = Math.min(boxH, maxDrawableH);
            //         const drawW = boxW;
            //         const x = cell.cell.x + (cw - drawW) / 2;
            //         const y = cell.cell.y + (ch - drawH) / 2;
            //         try { doc.addImage(img, "JPEG", x, y, drawW, drawH); }
            //         catch { try { doc.addImage(img, "PNG", x, y, drawW, drawH); } catch { } }
            //     }

            //     // Name + Spec styling
            //     if (cell.section === "body" && cell.column.index === 2) {
            //         const name = (cell.cell as any).customName || "";
            //         const spec = (cell.cell as any).customSpec || "";
            //         const x = cell.cell.x + 2;
            //         let y = cell.cell.y + 6;

            //         if (name) {
            //             doc.setFont("helvetica", "bold");
            //             doc.setFontSize(10);
            //             doc.setTextColor(30, 144, 255); // sky blue
            //             doc.text(name, x, y, { baseline: "top" });
            //         }

            //         if (spec) {
            //             y += 5;
            //             doc.setFont("helvetica", "normal");
            //             doc.setFontSize(7);
            //             doc.setTextColor(0, 0, 0);
            //             doc.text(spec, x, y, { baseline: "top" });
            //         }
            //     }
            // }


            // --- Step 2: Render with custom colors --- 2nd version 
            // didDrawCell: (cell) => {
            //     // --- Image column ---
            //     if (cell.section === "body" && cell.column.index === 1) {
            //         const img = productImages[cell.row.index];
            //         if (!img) return;

            //         const cw = cell.cell.width;
            //         const ch = cell.cell.height;

            //         const x = cell.cell.x + 2;
            //         const y = cell.cell.y + 2;

            //         try {
            //             // Get image dimensions
            //             const imgProps = doc.getImageProperties(img);
            //             const ratio = imgProps.width / imgProps.height;

            //             // Fit into box without enlarging
            //             let drawW = imgProps.width * 0.25; // scale down for safety
            //             let drawH = drawW / ratio;

            //             if (drawW > cw - 4) {
            //                 drawW = cw - 4;
            //                 drawH = drawW / ratio;
            //             }
            //             if (drawH > ch - 4) {
            //                 drawH = ch - 4;
            //                 drawW = drawH * ratio;
            //             }

            //             // Center image
            //             const offsetX = x + (cw - drawW) / 2 - 2;
            //             const offsetY = y + (ch - drawH) / 2 - 2;

            //             doc.addImage(img, "PNG", offsetX, offsetY, drawW, drawH);
            //         } catch (e) { }
            //     }

            //     // --- Name & Spec column ---
            //     if (cell.section === "body" && cell.column.index === 2) {
            //         const name = (cell.cell as any).customName || "";
            //         const spec = (cell.cell as any).customSpec || "";
            //         const x = cell.cell.x + 2;
            //         let y = cell.cell.y + 6;

            //         if (name) {
            //             doc.setFont("helvetica", "bold");
            //             doc.setFontSize(10);
            //             doc.setTextColor(30, 144, 255); // sky blue
            //             doc.text(name, x, y, { maxWidth: cell.cell.width - 4, baseline: "top" });
            //         }

            //         if (spec) {
            //             y += 6;
            //             doc.setFont("helvetica", "normal");
            //             doc.setFontSize(7);
            //             doc.setTextColor(0, 0, 0);
            //             doc.text(spec, x, y, {
            //                 maxWidth: cell.cell.width - 4,
            //                 baseline: "top",
            //             });
            //         }
            //     }
            // }


            // --- Step 2: Render with custom colors --- 3rd version (final)
            didDrawCell: (cell) => {
                // --- Images stay the same ---
                if (cell.section === "body" && cell.column.index === 1) {
                    const img = productImages[cell.row.index];
                    if (!img) return;

                    try {
                        const props = doc.getImageProperties(img);
                        const ratio = props.width / props.height;

                        // fit image inside without enlarging
                        let drawW = Math.min(props.width, cell.cell.width - 4);
                        let drawH = drawW / ratio;

                        if (drawH > cell.cell.height - 4) {
                            drawH = cell.cell.height - 4;
                            drawW = drawH * ratio;
                        }

                        const x = cell.cell.x + (cell.cell.width - drawW) / 2;
                        const y = cell.cell.y + (cell.cell.height - drawH) / 2;
                        doc.addImage(img, "PNG", x, y, drawW, drawH);
                    } catch { }
                }

                // --- Custom Name + Spec ---
                if (cell.section === "body" && cell.column.index === 2) {
                    const name = (cell.cell as any).customName || "";
                    const spec = (cell.cell as any).customSpec || "";

                    const x = cell.cell.x + 2;
                    let y = cell.cell.y + 6;

                    if (name) {
                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(10);
                        doc.setTextColor(30, 144, 255);
                        doc.text(name, x, y, { maxWidth: cell.cell.width - 4 });
                        y += 6;
                    }

                    if (spec) {
                        doc.setFont("helvetica", "normal");
                        doc.setFontSize(7);
                        doc.setTextColor(0, 0, 0);
                        const wrapped = doc.splitTextToSize(spec, cell.cell.width - 4);
                        doc.text(wrapped, x, y, { maxWidth: cell.cell.width - 4 });
                    }
                }
            }
        });


        doc.save("price-list.pdf");
    };

    const [brands, setBrands] = useState<BrandOpt[]>([])
    const [brandLoading, setBrandLoading] = useState(false)
    const [brandError, setBrandError] = useState<string | null>(null)
    const [selectedBrandId, setSelectedBrandId] = useState<string>("")

    const [products, setProducts] = useState<ProductRow[]>([])
    const [loadingProducts, setLoadingProducts] = useState(false)
    const [productError, setProductError] = useState<string | null>(null)

    const [q, setQ] = useState("")

    // Fetch brands once
    useEffect(() => {
        let cancelled = false
            ; (async () => {
                setBrandLoading(true)
                setBrandError(null)
                try {
                    const res = await fetch("/api/brands", { cache: "no-store" })
                    if (!res.ok) throw new Error("Failed to load brands")
                    const json = await res.json()
                    const opts: BrandOpt[] = (json?.data ?? []).map((b: any) => ({ id: b._id, name: b.name }))
                    if (!cancelled) setBrands(opts)
                } catch (e: any) {
                    if (!cancelled) setBrandError(e?.message ?? "Could not load brands")
                } finally {
                    if (!cancelled) setBrandLoading(false)
                }
            })()
        return () => { cancelled = true }
    }, [])

    const fetchPriceList = async () => {
        if (!selectedBrandId) return
        setLoadingProducts(true)
        setProductError(null)
        try {
            // Fetch products and product order in parallel
            const [productsRes, orderRes] = await Promise.all([
                fetch(`/api/products?brandId=${encodeURIComponent(selectedBrandId)}`, { cache: "no-store" }),
                fetch(`/api/brands/${selectedBrandId}/products-order`, { cache: "no-store" })
            ])
            if (!productsRes.ok) throw new Error("Failed to load products")
            const productsJson = await productsRes.json()
            const all: ProductRow[] = productsJson?.data ?? []
            // Filter by brandId
            const onlyThisBrand = all.filter(p => extractBrandId(p.brandId) === selectedBrandId)
            // Get product order array
            let productOrder: string[] = []
            if (orderRes.ok) {
                const orderJson = await orderRes.json()
                productOrder = orderJson?.data?.productOrder ?? []
            }
            // Sort products according to productOrder
            const missing = onlyThisBrand.filter(p => !productOrder.includes(p._id))
            const ordered = productOrder
                .map(id => onlyThisBrand.find(p => p._id === id))
                .filter(Boolean) as ProductRow[]
            const finalList = [...missing, ...ordered]
            setProducts(finalList)
        } catch (e: any) {
            setProductError(e?.message ?? "Could not load products")
            setProducts([])
        } finally {
            setLoadingProducts(false)
        }
    }

    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase()
        if (!query) return products
        return products.filter(p =>
            p.name.toLowerCase().includes(query)
        )
    }, [products, q])

    // ✅ Only active products
    const activeProducts = useMemo(() => {
        return filtered.filter((p) => p.status === "active");
    }, [filtered]);


    return (
        <DashboardLayout>
            <div className="flex-1 space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight  text-[oklch(35.04%_0.01007_216.95)]">Product Price List</h1>
                        <p className="text-[oklch(44.226%_0.00005_271.152)]  font-semibold">Get brand price list distribution</p>
                    </div>

                    <div className="flex gap-2">
                        <div className="w-56">
                            <Select
                                value={selectedBrandId}
                                onValueChange={setSelectedBrandId}
                                disabled={brandLoading || !!brandError}
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder={brandLoading ? "Loading brands…" : "Select brand"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {brandError && (
                                        <div className="px-3 py-2 text-sm text-red-500">{brandError}</div>
                                    )}
                                    {!brandError && brands.length === 0 && !brandLoading && (
                                        <div className="px-3 py-2 text-sm text-muted-foreground">No brands found</div>
                                    )}
                                    <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                                        {brands.map(b => (
                                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                        ))}
                                    </div>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            className=" bg-[oklch(32.988%_0.05618_196.615)] text-white hover:bg-accent/90"
                            onClick={fetchPriceList}
                            disabled={!selectedBrandId || brandLoading}
                            title={!selectedBrandId ? "Select a brand first" : "Get Price List"}
                        >
                            <List className="mr-2 h-4 w-4" />
                            Get Price List
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm text-[oklch(35.04%_0.01007_216.95)] font-bold">Products (Fetched)</CardTitle>
                            <List className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{activeProducts.length}</div>
                            <p className="text-xs text-muted-foreground">
                                {selectedBrandId ? "For selected brand" : "Select a brand to view"}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex gap-2 mb-2">
                    <Button className="bg-[oklch(32.988%_0.05618_196.615)]/80" onClick={handleExportExcel} disabled={filtered.length === 0} title="Export as Excel">
                        <FileDown className="mr-2 h-4 w-4" /> Export Excel
                    </Button>
                    <Button className="bg-[oklch(32.988%_0.05618_196.615)]/80" onClick={handleExportPDF} disabled={filtered.length === 0} title="Export as PDF">
                        <FileDown className="mr-2 h-4 w-4" /> Export PDF
                    </Button>

                    {/* New Date input */}
                    <input
                        type="date"
                        className="border rounded px-2 py-1 text-sm"
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                    />
                
                </div>

                <Card className="border-border">
                    <CardHeader>
                        <CardTitle className="font-bold ">Price List</CardTitle>
                        <CardDescription>
                            {selectedBrandId ? "Products for the selected brand" : "Choose a brand and click Get Price List"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {productError && <div className="text-sm text-red-500">{productError}</div>}

                        {loadingProducts ? (
                            <div className="text-muted-foreground">Loading…</div>
                        ) : products.length === 0 ? (
                            <div className="text-muted-foreground text-sm">
                                {selectedBrandId ? "No products found for this brand." : "Nothing to show yet."}
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-md border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr className="text-left">
                                            <th className="px-3 py-2 font-bold">Sr. No.</th>
                                            <th className="px-3 py-2 font-bold">Name</th>
                                            <th className="px-3 py-2 font-bold">Price</th>
                                            <th className="px-3 py-2 font-bold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                            {activeProducts.map((p,index) => (
                                            <tr key={p._id} className="border-t">
                                                    <td className="px-3 py-2">{index + 1}</td>
                                                <td className="px-3 py-2">{p.name}</td>
                                                <td className="px-3 py-2">
                                                        {p.isPOR ? "POR" : typeof p.price === "number" ? `₹ ${formatINR(p.price)}` : "—"}
                                                </td>
                                                <td className="px-3 py-2 capitalize">{p.status || "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
