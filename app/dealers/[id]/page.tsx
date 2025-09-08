"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function DealerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const dealerId = params?.id as string
  const [dealer, setDealer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    (async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/dealers/${dealerId}`)
        if (!res.ok) throw new Error("Failed to load dealer data")
        const { data } = await res.json()
        setDealer(data)
      } catch (e: any) {
        setError(e?.message ?? "Failed to load dealer")
      } finally {
        setLoading(false)
      }
    })()
  }, [dealerId])

  const handleEdit = () => {
    router.push(`/dealers/${dealerId}/edit`)
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this dealer?")) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/dealers/${dealerId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      router.push("/dealers")
    } catch (e) {
      alert("Failed to delete dealer.")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-muted-foreground">Loading dealer data…</div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !dealer) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-red-500">{error || "Dealer not found"}</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold tracking-tight text-[oklch(35.04%_0.01007_216.95)]  ">Dealer Details :</h1>
          <div className="flex gap-2">
            <Button variant="default" onClick={handleEdit}>Edit</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</Button>
          </div>
        </div>
        <div className="bg-white/70 rounded-xl shadow p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div>
                <span className="font-semibold">Dealer Name:</span> {dealer.name}
              </div>
              <div>
                <span className="font-semibold">Contact Person:</span> {dealer.contactPerson}
              </div>
              <div>
                <span className="font-semibold">Email:</span> {dealer.email}
              </div>
              <div>
                <span className="font-semibold">Phone:</span> {dealer.phone}
              </div>
              <div>
                <span className="font-semibold">Address:</span> {dealer.address}
              </div>
              <div>
                <span className="font-semibold">City:</span> {dealer.city}
              </div>
              <div>
                <span className="font-semibold">State:</span> {dealer.state}
              </div>
              <div>
                <span className="font-semibold">Zip Code:</span> {dealer.zipCode}
              </div>
              <div>
                <span className="font-semibold">Status:</span> {dealer.status}
              </div>
              <div>
                <span className="font-semibold">Dealer Type:</span> {dealer.dealerType}
              </div>
              <div>
                <span className="font-semibold">Territory:</span> {dealer.territory}
              </div>
              <div>
                <span className="font-semibold">Registered:</span> {dealer.registrationDate ? new Date(dealer.registrationDate).toLocaleDateString() : "-"}
              </div>
            </div>
            <div className="w-full md:w-40 flex flex-col items-center space-y-2">
              <span className="font-semibold">Dealer Logo</span>
              {dealer.logoUrl && (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                  <Image src={dealer.logoUrl} alt="Dealer logo" fill sizes="80px" className="object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
