"use client"


import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/dashboard-layout"

type OtherBrandUI = {
  id: string
  name: string
  description?: string
  websiteUrl?: string
  status: "active" | "inactive"
  createdAt?: string
}

export default function OtherBrandDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { id } = params
  const [brand, setBrand] = useState<OtherBrandUI | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBrand() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/other-brands/${id}`)
        if (!res.ok) throw new Error("Brand not found")
        const { data } = await res.json()
        setBrand(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }
    fetchBrand()
  }, [id])

  if (loading) return <div className="p-8 text-center">Loading…</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>
  if (!brand) return <div className="p-8 text-center">No brand found.</div>

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{brand.name}</CardTitle>
            <CardDescription>{brand.websiteUrl ? <a href={brand.websiteUrl} target="_blank" rel="noreferrer">{brand.websiteUrl}</a> : "No website"}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-muted-foreground">{brand.description || "No description"}</p>
            <div className="flex gap-4 text-sm">
              <span>Status: <b>{brand.status}</b></span>
              <span>Created: {brand.createdAt ? new Date(brand.createdAt).toLocaleDateString() : "-"}</span>
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" onClick={() => router.push("/other_brands")}>Back to list</Button>
              <Button className="ml-2" onClick={() => router.push(`/other_brands/${id}/edit`)}>Edit</Button>
              <Button className="ml-2" variant="destructive" onClick={async () => {
                if (!window.confirm("Are you sure you want to delete this brand? This action cannot be undone.")) return;
                try {
                  const res = await fetch(`/api/other-brands/${id}`, { method: "DELETE" });
                  if (!res.ok) throw new Error("Failed to delete brand");
                  router.push("/other_brands");
                } catch (e) {
                  alert(e instanceof Error ? e.message : "Failed to delete brand");
                }
              }}>Delete</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
