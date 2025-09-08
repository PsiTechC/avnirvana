// "use client"

// import { useState } from "react"
// import { DealerCard } from "./dealer-card"
// import { EditDealerDialog } from "./edit-dealer-dialog"
// import { DeleteDealerDialog } from "./delete-dealer-dialog"

// interface Dealer {
//   id: string
//   name: string
//   contactPerson: string
//   email: string
//   phone: string
//   address: string
//   city: string
//   state: string
//   zipCode: string
//   status: "Active" | "Inactive"
//   registrationDate: string
//   dealerType: "Authorized" | "Premium" | "Standard"
//   territory: string
//   logo?: string
// }

// const mockDealers: Dealer[] = [
//   {
//     id: "1",
//     name: "AudioTech Solutions",
//     contactPerson: "John Smith",
//     email: "john@audiotech.com",
//     phone: "+1 (555) 123-4567",
//     address: "123 Main Street",
//     city: "New York",
//     state: "NY",
//     zipCode: "10001",
//     status: "Active",
//     registrationDate: "2023-01-15",
//     dealerType: "Premium",
//     territory: "Northeast",
//     logo: "/audiotech-logo.png",
//   },
//   {
//     id: "2",
//     name: "Sound Pro Electronics",
//     contactPerson: "Sarah Johnson",
//     email: "sarah@soundpro.com",
//     phone: "+1 (555) 987-6543",
//     address: "456 Oak Avenue",
//     city: "Los Angeles",
//     state: "CA",
//     zipCode: "90210",
//     status: "Active",
//     registrationDate: "2023-03-22",
//     dealerType: "Authorized",
//     territory: "West Coast",
//     logo: "/sound-pro-logo.png",
//   },
//   {
//     id: "3",
//     name: "Elite Audio Systems",
//     contactPerson: "Michael Brown",
//     email: "michael@eliteaudio.com",
//     phone: "+1 (555) 456-7890",
//     address: "789 Pine Road",
//     city: "Chicago",
//     state: "IL",
//     zipCode: "60601",
//     status: "Inactive",
//     registrationDate: "2022-11-08",
//     dealerType: "Standard",
//     territory: "Midwest",
//     logo: "/elite-audio-logo.png",
//   },
//   {
//     id: "4",
//     name: "Premium Sound Co.",
//     contactPerson: "Lisa Davis",
//     email: "lisa@premiumsound.com",
//     phone: "+1 (555) 321-0987",
//     address: "321 Elm Street",
//     city: "Miami",
//     state: "FL",
//     zipCode: "33101",
//     status: "Active",
//     registrationDate: "2023-06-10",
//     dealerType: "Premium",
//     territory: "Southeast",
//     logo: "/premium-sound-logo.png",
//   },
//   {
//     id: "5",
//     name: "Tech Audio Distributors",
//     contactPerson: "Robert Wilson",
//     email: "robert@techaudio.com",
//     phone: "+1 (555) 654-3210",
//     address: "654 Maple Drive",
//     city: "Dallas",
//     state: "TX",
//     zipCode: "75201",
//     status: "Active",
//     registrationDate: "2023-02-28",
//     dealerType: "Authorized",
//     territory: "Southwest",
//     logo: "/placeholder-c4q2p.png",
//   },
//   {
//     id: "6",
//     name: "Metro Audio Solutions",
//     contactPerson: "Jennifer Lee",
//     email: "jennifer@metroaudio.com",
//     phone: "+1 (555) 789-0123",
//     address: "987 Cedar Lane",
//     city: "Seattle",
//     state: "WA",
//     zipCode: "98101",
//     status: "Inactive",
//     registrationDate: "2022-09-15",
//     dealerType: "Standard",
//     territory: "Northwest",
//     logo: "/metro-audio-logo.png",
//   },
// ]

// export function DealerGrid() {
//   const [dealers, setDealers] = useState<Dealer[]>(mockDealers)
//   const [editingDealer, setEditingDealer] = useState<Dealer | null>(null)
//   const [deletingDealer, setDeletingDealer] = useState<Dealer | null>(null)

//   const handleEdit = (dealer: Dealer) => {
//     setEditingDealer(dealer)
//   }

//   const handleDelete = (dealer: Dealer) => {
//     setDeletingDealer(dealer)
//   }

//   const handleSaveEdit = (updatedDealer: Dealer) => {
//     setDealers(dealers.map((d) => (d.id === updatedDealer.id ? updatedDealer : d)))
//     setEditingDealer(null)
//   }

//   const handleConfirmDelete = () => {
//     if (deletingDealer) {
//       setDealers(dealers.filter((d) => d.id !== deletingDealer.id))
//       setDeletingDealer(null)
//     }
//   }

//   return (
//     <>
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {dealers.map((dealer) => (
//           <DealerCard key={dealer.id} dealer={dealer} onEdit={handleEdit} onDelete={handleDelete} />
//         ))}
//       </div>

//       <EditDealerDialog
//         dealer={editingDealer}
//         open={!!editingDealer}
//         onOpenChange={(open) => !open && setEditingDealer(null)}
//         onSave={handleSaveEdit}
//       />

//       <DeleteDealerDialog
//         dealer={deletingDealer}
//         open={!!deletingDealer}
//         onOpenChange={(open) => !open && setDeletingDealer(null)}
//         onConfirm={handleConfirmDelete}
//       />
//     </>
//   )
// }


"use client"

import { useEffect, useState } from "react"
import { DealerCard } from "./dealer-card"
import { DeleteDealerDialog } from "./delete-dealer-dialog"

interface Dealer {
  id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  status: "Active" | "Inactive"
  registrationDate: string
  dealerType: "Authorized" | "Premium" | "Standard"
  territory: string
  logo?: string
  logoUrl?: string
}

interface DealerGridProps {
  searchTerm: string
  statusFilter: string
  typeFilter: string
  territoryFilter: string
}

export function DealerGrid({ searchTerm, statusFilter, typeFilter, territoryFilter}: DealerGridProps) {
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null)
  const [deletingDealer, setDeletingDealer] = useState<Dealer | null>(null)

  // Load from API
  useEffect(() => {
    let cancel = false;
    (async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/dealers", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load dealers")
        const json = await res.json()
        const items = (json?.data ?? []).map((d: any): Dealer => ({
          id: d._id,
          name: d.name ?? "",
          contactPerson: d.contactPerson ?? "",
          email: d.email ?? "",
          phone: d.phone ?? "",
          address: d.address ?? "",
          city: d.city ?? "",
          state: d.state ?? "",
          zipCode: d.zipCode ?? "",
          status: (d.status as "Active" | "Inactive") ?? "Active",
          registrationDate: d.registrationDate ?? d.createdAt ?? new Date().toISOString(),
          dealerType: (d.dealerType as "Authorized" | "Premium" | "Standard") ?? "Standard",
          territory: d.territory ?? "",
          logo: d.logoUrl ?? d.logo ?? undefined,
          logoUrl: d.logoUrl ?? undefined,
        }))
        if (!cancel) setDealers(items)
      } catch (e: any) {
        if (!cancel) setError(e?.message ?? "Failed to load")
      } finally {
        if (!cancel) setIsLoading(false)
      }
    })()
    return () => {
      cancel = true
    }
  }, [])

  // Filtering
  const filtered = dealers.filter((dealer) => {
    const matchesSearch =
      searchTerm === "" ||
      dealer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dealer.contactPerson ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dealer.email ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || dealer.status === statusFilter
    const matchesType = typeFilter === "all" || dealer.dealerType === typeFilter
    const matchesTerritory = territoryFilter === "all" || dealer.territory === territoryFilter
    return matchesSearch && matchesStatus && matchesType && matchesTerritory
  })

  // Dialog handlers
  const handleEdit = (dealer: Dealer) => setEditingDealer(dealer)
  const handleDelete = (dealer: Dealer) => setDeletingDealer(dealer)

  // The Edit dialog should already call the API; we optimistically update local list
  const handleSaveEdit = (updated: Dealer) => {
    setDealers(prev => prev.map(d => (d.id === updated.id ? updated : d)))
    setEditingDealer(null)
  }

  // The Delete dialog calls the API; we remove locally when it confirms
  const handleConfirmDelete = () => {
    if (!deletingDealer) return
    setDealers(prev => prev.filter(d => d.id !== deletingDealer.id))
    setDeletingDealer(null)
  }

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-12">Loading dealers…</div>
  }
  if (error) {
    return <div className="text-center text-red-500 py-12">{error}</div>
  }
  if (filtered.length === 0) {
    return <div className="text-center text-muted-foreground py-12">No dealers found. Add your first one!</div>
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((dealer) => (
          <DealerCard key={dealer.id} dealer={dealer} onEdit={handleEdit} onDelete={handleDelete} />
        ))}
      </div>

      {/* <EditDealerDialog
        dealer={editingDealer}
        open={!!editingDealer}
        onOpenChange={(open) => !open && setEditingDealer(null)}
        onSave={handleSaveEdit}
      /> */}

      <DeleteDealerDialog
        dealer={deletingDealer}
        open={!!deletingDealer}
        onOpenChange={(open) => !open && setDeletingDealer(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
