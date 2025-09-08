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

    const handleExportExcel = async () => {
        // Fetch header info just-in-time
        const { brand, company } = await fetchExportHeaderInfo(selectedBrandId);
        // Use xlsx-populate for image embedding
        // @ts-ignore
        const XPop = await import("xlsx-populate/browser/xlsx-populate-no-encryption");
        // Preload images as base64
        const imagePromises = filtered.map(async (p) => {
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
        const rows = filtered.map((p, i) => [
            images[i],
            p.name,
            p.specification || "",
            typeof p.gstPercent === "number" ? p.gstPercent : "",
            p.isPOR ? "POR" : typeof p.price === "number" ? p.price : ""
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
                // Place in cell E1 (col 5)
                sheet.cell(headerRow, 5).value(info).style({ bold: true, fontSize: 11 });
            }
            // Merge header row for company info
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
        const doc = new jsPDF();
        const tableColumn = ["Image", "Name", "Specification", "GST %", "MRP"];
        // Preload images as base64
        const imagePromises = filtered.map(async (p) => {
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
        const tableRows = filtered.map((p, i) => [
            images[i] && typeof images[i] === 'string' && images[i].startsWith('data:image') ? { image: images[i] } : '',
            p.name,
            p.specification || "",
            typeof p.gstPercent === "number" ? p.gstPercent : "",
            p.isPOR ? "POR" : typeof p.price === "number" ? p.price : ""
        ]);
        // --- Custom Header: Brand Logo (left), Company Info (right) ---
    let headerHeight = 28;
    let headerY = 4; // Reduced from 10 to 4 for less top padding
    let logoWidth = 32;
    let logoHeight = 28;
    let margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
        // Draw brand logo (left)
        if (brand?.logoUrl) {
            try {
                let logoUrl = brand.logoUrl;
                if (logoUrl.startsWith("/")) logoUrl = window.location.origin + logoUrl;
                const proxied = `/api/proxy?url=${encodeURIComponent(logoUrl)}`;
                const res = await fetch(proxied);
                const blob = await res.blob();
                const base64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result?.toString() || "");
                    reader.readAsDataURL(blob);
                });
                if (typeof base64 === 'string' && base64.startsWith('data:image')) {
                    try {
                        doc.addImage(base64, 'PNG', margin, headerY, logoWidth, logoHeight);
                    } catch {
                        try { doc.addImage(base64, 'JPEG', margin, headerY, logoWidth, logoHeight); } catch { }
                    }
                }
            } catch { }
        }
        // Draw company info (right, fully right-aligned, not overlapping logo)
        // Add AV Nirvana logo above company info
        if (company) {
            const infoLines = [
                company.address + ", " + company.city + ", " + company.state + " " + company.zipCode,
                company.country,
                `Phone: ${company.phone}  Email: ${company.email}`,
                company.website ? `Website: ${company.website}` : "",
                company.gstin ? `GSTIN: ${company.gstin}` : "",
            ].filter(Boolean);
            doc.setFontSize(8);
            doc.setFont('sans', 'normal');
            // Calculate right margin for company info
            const rightX = pageWidth - margin;
            // --- AV Nirvana logo (above company info, right-aligned) ---
            const avNirvanaLogoUrl = '/avLogo.png';
            try {
                let logoUrl = avNirvanaLogoUrl;
                if (logoUrl.startsWith("/")) logoUrl = window.location.origin + logoUrl;
                const proxied = `/api/proxy?url=${encodeURIComponent(logoUrl)}`;
                const res = await fetch(proxied);
                const blob = await res.blob();
                const base64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result?.toString() || "");
                    reader.readAsDataURL(blob);
                });
                if (typeof base64 === 'string' && base64.startsWith('data:image')) {
                    
                    const logoW = 50;
                    const logoH = 16;
                    const logoX = pageWidth - margin - logoW;
                    const logoY = headerY;
                    try {
                        doc.addImage(base64, 'PNG', logoX, logoY, logoW, logoH);
                    } catch {
                        try { doc.addImage(base64, 'JPEG', logoX, logoY, logoW, logoH); } catch { }
                    }
                }
            } catch { }
            // --- Company info below AV Nirvana logo ---
            // Further decrease line height for more compact info
            let lineHeight = 2.5;
            // Start Y below logo (logoY + logoH + 2)
            let startY = headerY + 16 + 2;
            infoLines.forEach((line, idx) => {
                doc.text(line, rightX, startY + idx * lineHeight, { align: 'right' });
            });
        }
        // Table below header
    // Center the table horizontally on the page
    // Calculate total table width (sum of column widths)
    const colWidths = [24, 50, 70, 20, 30];
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    const tableMargin = (pageWidth - tableWidth) / 2;
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows as any[][],
            startY: headerY + headerHeight + 2,
            theme: 'grid',
            margin: { left: tableMargin, right: tableMargin },
            headStyles: {
                fillColor: [36, 97, 171],
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center',
                valign: 'middle',
                fontSize: 11,
                cellPadding: 4,
            },
            styles: {
                fontSize: 10,
                cellPadding: 4,
                halign: 'left',
                valign: 'middle',
                overflow: 'linebreak',
            },
            columnStyles: {
                0: { cellWidth: 24, halign: 'center', valign: 'middle' },
                1: { cellWidth: 50 },
                2: { cellWidth: 70 },
                3: { cellWidth: 20, halign: 'center' },
                4: { cellWidth: 30, halign: 'center' },
            },
            didDrawCell: function (data) {
                if (
                    data.column.index === 0 &&
                    data.cell.section === 'body' &&
                    typeof data.row.index === 'number'
                ) {
                    const rowRaw = data.row.raw as any[];
                    const imgObj = rowRaw && rowRaw[0];
                    const img = imgObj && typeof imgObj === 'object' && imgObj.image ? imgObj.image : null;
                    if (img && typeof img === 'string' && img.startsWith('data:image')) {
                        const cellWidth = data.cell.width;
                        const cellHeight = data.cell.height;
                        const imgSize = 20;
                        // Center image in cell
                        const x = data.cell.x + (cellWidth - imgSize) / 2;
                        const y = data.cell.y + (cellHeight - imgSize) / 2;
                        try {
                            doc.addImage(img, 'JPEG', x, y, imgSize, imgSize);
                        } catch (e) {
                            try {
                                doc.addImage(img, 'PNG', x, y, imgSize, imgSize);
                            } catch { }
                        }
                    }
                }
                // else: leave cell blank
            },
            rowPageBreak: 'avoid',
            didParseCell: function (data) {
                if (data.section === 'body') {
                    data.cell.height = 24;
                }
            },
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
            // (p.sku || "").toLowerCase().includes(query)
        )
    }, [products, q])

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
                            <div className="text-2xl font-bold">{products.length}</div>
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
                </div>
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle className="font-bold ">Price List</CardTitle>
                        <CardDescription>
                            {selectedBrandId ? "Products for the selected brand" : "Choose a brand and click Get Price List"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* <div className="flex items-center gap-2">
                            <Input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search by name or SKU…"
                                className="max-w-sm"
                            />
                        </div> */}

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
                                            <th className="px-3 py-2 font-bold">Name</th>
                                            {/* <th className="px-3 py-2 font-medium">SKU</th> */}
                                            <th className="px-3 py-2 font-bold">Price</th>
                                            {/* <th className="px-3 py-2 font-medium">Stock</th> */}
                                            <th className="px-3 py-2 font-bold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((p) => (
                                            <tr key={p._id} className="border-t">
                                                <td className="px-3 py-2">{p.name}</td>
                                                {/* <td className="px-3 py-2">{p.sku || "—"}</td> */}
                                                <td className="px-3 py-2">
                                                    {p.isPOR ? "POR" : typeof p.price === "number" ? `Rs ${p.price.toFixed(2)}` : "—"}
                                                </td>
                                                {/* <td className="px-3 py-2">{typeof p.stockLevel === "number" ? p.stockLevel : "—"}</td> */}
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
