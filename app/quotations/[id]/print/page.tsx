// app/(dashboard)/quotations/[id]/print/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import QuotationPDF from "@/components/quotations/quotation-pdf"

export default function QuotationPrintPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const quotationId = params?.id as string
  const [quotation, setQuotation] = useState<any>(null)
  const [template, setTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        // Fetch quotation
        const qRes = await fetch(`/api/quotations/${quotationId}`)
        if (!qRes.ok) throw new Error("Failed to load quotation")
        const qData = await qRes.json()
        setQuotation(qData.data)

        // Get templateId from query string or from quotation
        const urlTemplateId = searchParams.get("templateId")
        const templateId = urlTemplateId || qData.data?.templateId
        if (templateId) {
          const tRes = await fetch(`/api/quotation-templates/${templateId}`)
          const tText = await tRes.text()
          if (!tRes.ok) throw new Error("Failed to load template: " + tText)
          const tData = JSON.parse(tText)
          setTemplate(tData.data)
        } else {
          setTemplate(null)
        }
      } catch (e: any) {
        setError(e?.message ?? "Error loading data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [quotationId, searchParams])

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-muted-foreground">Loading…</div>
  }
  if (error || !quotation) {
    return <div className="flex items-center justify-center h-screen text-red-500">{error || "Quotation not found"}</div>
  }

  // Normalize areas/items for QuotationPDF
  let areas = Array.isArray(quotation?.areas) ? quotation.areas : [];
  let items = [];
  if (areas.length > 0) {
    // Flatten all area items, tagging area name
    items = areas.flatMap((area: any) => (area.items || []).map((item: any) => ({
      ...item,
      areaRoomTypeName: area.areaRoomTypeName || "",
      areaRoomTypeId: area.areaRoomTypeId || ""
    })));
  } else {
    items = Array.isArray(quotation?.items) ? quotation.items : [];
  }

  // Compose props for QuotationPDF
  const pdfProps = {
    quotation: {
      ...quotation,
      areas,
      items,
    },
    company: template?.company,
    coverImage: template?.cover?.bgImageUrl || template?.cover?.backgroundImage || "",
    proposalNote: template?.proposalNote?.markdown || template?.proposalNote?.html || "",
    closingNote: template?.closingNote?.markdown || template?.closingNote?.html || "",
    closingImage: template?.closingNote?.closingNoteImage || "",
    aboutText: template?.aboutUs?.markdown || template?.aboutUs?.html || "",
    aboutImage: template?.aboutUs?.aboutImage || "",
  }

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <QuotationPDF {...pdfProps} />
    </div>
  )
}
