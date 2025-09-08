// "use client"

// import { useState } from "react"
// import { QuotationCard } from "./quotation-card"
// import { EditQuotationDialog } from "./edit-quotation-dialog"
// import { DeleteQuotationDialog } from "./delete-quotation-dialog"
// import { ViewQuotationDialog } from "./view-quotation-dialog"

// interface QuotationItem {
//   id: string
//   productId: string
//   productName: string
//   quantity: number
//   unitPrice: number
//   total: number
// }

// interface Quotation {
//   id: string
//   quotationNumber: string
//   dealerName: string
//   dealerId: string
//   contactPerson: string
//   email: string
//   phone: string
//   status: "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired"
//   createdDate: string
//   validUntil: string
//   items: QuotationItem[]
//   subtotal: number
//   tax: number
//   total: number
//   notes?: string
// }

// const mockQuotations: Quotation[] = [
//   {
//     id: "1",
//     quotationNumber: "QUO-2024-001",
//     dealerName: "AudioTech Solutions",
//     dealerId: "1",
//     contactPerson: "John Smith",
//     email: "john@audiotech.com",
//     phone: "+1 (555) 123-4567",
//     status: "Sent",
//     createdDate: "2024-01-15",
//     validUntil: "2024-02-15",
//     items: [
//       {
//         id: "1",
//         productId: "1",
//         productName: "Premium HDMI Cable 4K",
//         quantity: 50,
//         unitPrice: 29.99,
//         total: 1499.5,
//       },
//       {
//         id: "2",
//         productId: "2",
//         productName: "Wireless Bluetooth Speaker",
//         quantity: 25,
//         unitPrice: 149.99,
//         total: 3749.75,
//       },
//     ],
//     subtotal: 5249.25,
//     tax: 524.93,
//     total: 5774.18,
//     notes: "Bulk discount applied for quantities over 20 units per item.",
//   },
//   {
//     id: "2",
//     quotationNumber: "QUO-2024-002",
//     dealerName: "Sound Pro Electronics",
//     dealerId: "2",
//     contactPerson: "Sarah Johnson",
//     email: "sarah@soundpro.com",
//     phone: "+1 (555) 987-6543",
//     status: "Draft",
//     createdDate: "2024-01-18",
//     validUntil: "2024-02-18",
//     items: [
//       {
//         id: "3",
//         productId: "3",
//         productName: "Professional Microphone",
//         quantity: 10,
//         unitPrice: 299.99,
//         total: 2999.9,
//       },
//     ],
//     subtotal: 2999.9,
//     tax: 299.99,
//     total: 3299.89,
//   },
//   {
//     id: "3",
//     quotationNumber: "QUO-2024-003",
//     dealerName: "Elite Audio Systems",
//     dealerId: "3",
//     contactPerson: "Michael Brown",
//     email: "michael@eliteaudio.com",
//     phone: "+1 (555) 456-7890",
//     status: "Accepted",
//     createdDate: "2024-01-10",
//     validUntil: "2024-02-10",
//     items: [
//       {
//         id: "4",
//         productId: "4",
//         productName: "Studio Monitor Speakers",
//         quantity: 8,
//         unitPrice: 599.99,
//         total: 4799.92,
//       },
//       {
//         id: "5",
//         productId: "5",
//         productName: "Audio Interface",
//         quantity: 5,
//         unitPrice: 399.99,
//         total: 1999.95,
//       },
//     ],
//     subtotal: 6799.87,
//     tax: 679.99,
//     total: 7479.86,
//     notes: "Premium dealer discount applied.",
//   },
//   {
//     id: "4",
//     quotationNumber: "QUO-2024-004",
//     dealerName: "Premium Sound Co.",
//     dealerId: "4",
//     contactPerson: "Lisa Davis",
//     email: "lisa@premiumsound.com",
//     phone: "+1 (555) 321-0987",
//     status: "Rejected",
//     createdDate: "2024-01-05",
//     validUntil: "2024-02-05",
//     items: [
//       {
//         id: "6",
//         productId: "6",
//         productName: "Wireless Headphones",
//         quantity: 30,
//         unitPrice: 199.99,
//         total: 5999.7,
//       },
//     ],
//     subtotal: 5999.7,
//     tax: 599.97,
//     total: 6599.67,
//     notes: "Customer requested different specifications.",
//   },
// ]

// export function QuotationGrid() {
//   const [quotations, setQuotations] = useState<Quotation[]>(mockQuotations)
//   const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null)
//   const [deletingQuotation, setDeletingQuotation] = useState<Quotation | null>(null)
//   const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(null)

//   const handleEdit = (quotation: Quotation) => {
//     setEditingQuotation(quotation)
//   }

//   const handleDelete = (quotation: Quotation) => {
//     setDeletingQuotation(quotation)
//   }

//   const handleView = (quotation: Quotation) => {
//     setViewingQuotation(quotation)
//   }

//   const handleSaveEdit = (updatedQuotation: Quotation) => {
//     setQuotations(quotations.map((q) => (q.id === updatedQuotation.id ? updatedQuotation : q)))
//     setEditingQuotation(null)
//   }

//   const handleConfirmDelete = () => {
//     if (deletingQuotation) {
//       setQuotations(quotations.filter((q) => q.id !== deletingQuotation.id))
//       setDeletingQuotation(null)
//     }
//   }

//   return (
//     <>
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {quotations.map((quotation) => (
//           <QuotationCard
//             key={quotation.id}
//             quotation={quotation}
//             onEdit={handleEdit}
//             onDelete={handleDelete}
//             onView={handleView}
//           />
//         ))}
//       </div>

//       <EditQuotationDialog
//         quotation={editingQuotation}
//         open={!!editingQuotation}
//         onOpenChange={(open) => !open && setEditingQuotation(null)}
//         onSave={handleSaveEdit}
//       />

//       <DeleteQuotationDialog
//         quotation={deletingQuotation}
//         open={!!deletingQuotation}
//         onOpenChange={(open) => !open && setDeletingQuotation(null)}
//         onConfirm={handleConfirmDelete}
//       />

//       <ViewQuotationDialog
//         quotation={viewingQuotation}
//         open={!!viewingQuotation}
//         onOpenChange={(open) => !open && setViewingQuotation(null)}
//       />
//     </>
//   )
// }




// // components/quotation-grid.tsx
// "use client"

// import { useEffect, useState } from "react"
// import QuotationCard from "@/components/quotations/quotation-card"

// type Props = {
//   status?: string
//   q?: string
//   dealerId?: string
// }
// export default function QuotationGrid({ status, q, dealerId }: Props) {
//   const [data, setData] = useState<any[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)

//   const load = async () => {
//     setLoading(true); setError(null)
//     try {
//       const qs = new URLSearchParams()
//       if (status) qs.set("status", status)
//       if (q) qs.set("q", q)
//       if (dealerId) qs.set("dealerId", dealerId)

//       const res = await fetch(`/api/quotations?${qs.toString()}`, { cache: "no-store" })
//       if (!res.ok) throw new Error("Failed to load quotations")
//       const json = await res.json()
//       setData(json?.data ?? [])
//     } catch (e: any) {
//       setError(e?.message ?? "Failed to load quotations")
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => { load() }, [status, q, dealerId])

//   if (loading) return <div className="text-muted-foreground">Loading…</div>
//   if (error) return <div className="text-red-500 text-sm">{error}</div>
//   if (data.length === 0) return <div className="text-sm text-muted-foreground">No quotations found.</div>

//   return (
//     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//       {data.map((row) => (
//         <QuotationCard key={row._id} q={row} />
//       ))}
//     </div>
//   )
// }


// "use client"

// import { useEffect, useState } from "react"
// import QuotationCard, { Quotation } from "@/components/quotations/quotation-card"

// type Props = {
//   status?: string
//   q?: string
//   dealerId?: string
//   onEdit?: (q: Quotation) => void
//   onDelete?: (q: Quotation) => void
//   onView?: (q: Quotation) => void
// }

// export default function QuotationGrid({ status, q, dealerId, onEdit, onDelete, onView }: Props) {
//   const [data, setData] = useState<Quotation[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)

//   const load = async () => {
//     setLoading(true); setError(null)
//     try {
//       const qs = new URLSearchParams()
//       if (status) qs.set("status", status)
//       if (q) qs.set("q", q)
//       if (dealerId) qs.set("dealerId", dealerId)

//       const res = await fetch(`/api/quotations?${qs.toString()}`, { cache: "no-store" })
//       if (!res.ok) throw new Error("Failed to load quotations")
//       const json = await res.json()
//       setData(json?.data ?? [])
//     } catch (e: any) {
//       setError(e?.message ?? "Failed to load quotations")
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => { load() }, [status, q, dealerId])

//   if (loading) return <div className="text-muted-foreground">Loading…</div>
//   if (error) return <div className="text-red-500 text-sm">{error}</div>
//   if (data.length === 0) return <div className="text-sm text-muted-foreground">No quotations found.</div>

//   return (
//     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//       {data.map((row) => (
//         <QuotationCard
//           key={row._id}
//           quotation={row}
//           onEdit={onEdit}
//           onDelete={onDelete}
//           onView={onView}
//         />
//       ))}
//     </div>
//   )
// }



"use client"

import { useEffect, useState } from "react"
import QuotationCard, { Quotation } from "@/components/quotations/quotation-card"

type Props = {
  status?: string
  q?: string
  dealerId?: string
  onEdit?: (q: Quotation) => void
  onDelete?: (q: Quotation) => void
  onView?: (q: Quotation) => void
  data?: Quotation[]
}

export default function QuotationGrid({ status, q, dealerId, onEdit, onDelete, onView, data }: Props) {
  // If data is provided by parent, use it. Otherwise, fetch from API.
  const [internalData, setInternalData] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (data) {
      setInternalData(data)
      setLoading(false)
      setError(null)
      return
    }
    const load = async () => {
      setLoading(true); setError(null)
      try {
        const qs = new URLSearchParams()
        if (status) qs.set("status", status)
        if (q) qs.set("q", q)
        if (dealerId) qs.set("dealerId", dealerId)
        const res = await fetch(`/api/quotations?${qs.toString()}`, { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load quotations")
        const json = await res.json()
        const rows: Quotation[] = (json?.data ?? []).map((r: any) => {
          const nested = r.dealer || r.client
          return nested
            ? {
              ...r,
              dealerId: r.dealerId ?? nested._id ?? nested.id,
              dealerName: r.dealerName ?? nested.name,
              contactPerson: r.contactPerson ?? nested.contactPerson,
              email: r.email ?? nested.email,
              phone: r.phone ?? nested.phone,
            }
            : r
        })
        setInternalData(rows)
      } catch (e: any) {
        setError(e?.message ?? "Failed to load quotations")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [data, status, q, dealerId])

  if (loading) return <div className="text-muted-foreground">Loading…</div>
  if (error) return <div className="text-red-500 text-sm">{error}</div>
  if (internalData.length === 0) return <div className="text-sm text-muted-foreground">No quotations found.</div>

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {internalData.map((row) => (
        <QuotationCard
          key={(row as any)._id ?? row.id ?? row.quotationNumber}
          quotation={row}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      ))}
    </div>
  )
}
