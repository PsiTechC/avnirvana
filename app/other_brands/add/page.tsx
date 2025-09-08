"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

type OtherBrandStatus = "active" | "inactive"

export default function AddOtherBrandPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    websiteUrl: "",
    status: "active" as OtherBrandStatus,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    try {
      const body = {
        name: formData.name,
        description: formData.description || undefined,
        websiteUrl: formData.websiteUrl || undefined,
        status: formData.status,
      }
      const res = await fetch("/api/other-brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const maybe = await res.json().catch(() => null)
        throw new Error(maybe?.error || "Failed to create brand")
      }
      router.push("/other_brands")
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[oklch(35.04%_0.01007_216.95)]  ">Add Other Brand</h1>
            <p className="text-sm font-semibold text-[oklch(44.226%_0.00005_271.152)] ">Fill in the details below</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <div className="grid gap-1">
              <Label className="text-xs font-bold text-[oklch(0%_0_0)] ">Brand Name</Label>
              <Input name="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Enter brand name" required maxLength={120} className="bg-white/20 border-black/30 text-black placeholder-white/60 backdrop-blur-sm rounded-lg text-sm py-1.5 px-2" />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs font-bold text-[oklch(0%_0_0)] ">Description</Label>
              <Textarea name="description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Enter brand description" rows={3} required maxLength={500} className="h-20 max-h-24 overflow-y-auto resize-none bg-white/20 border-black/30 text-black placeholder-white/60 backdrop-blur-sm rounded-lg scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100 text-sm py-1.5 px-2" style={{ minHeight: "5rem", maxHeight: "6rem", overflowY: "auto" }} />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs font-bold text-[oklch(0%_0_0)] ">Website URL</Label>
                <Input name="websiteUrl" type="url" value={formData.websiteUrl} onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })} placeholder="https://example.com" maxLength={2048} className="bg-white/20 border-black/30 text-black placeholder-white/60 backdrop-blur-sm rounded-lg text-sm py-1.5 px-2" />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs font-bold text-[oklch(0%_0_0)]">Status</Label>
              <Select value={formData.status} onValueChange={value => setFormData({ ...formData, status: value as OtherBrandStatus })}>
                <SelectTrigger className="bg-white/20 border-black/30 text-black backdrop-blur-sm rounded-lg text-sm py-1.5 px-2">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white/90 backdrop-blur-md border-black/20 rounded-lg text-sm">
                  <SelectItem value="active" className="text-gray-900 hover:bg-white/20 text-sm">Active</SelectItem>
                  <SelectItem value="inactive" className="text-gray-900 hover:bg-white/20 text-sm">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <div className="md:col-span-1"></div>
          <div className="flex justify-end gap-2 pt-6 md:col-span-3">
            <Button type="button" variant="default" onClick={() => router.push("/other_brands")} className="bg-white text-[oklch(0%_0_0)] hover:bg-[oklch(0.577_0.245_27.325)]/80 backdrop-blur-sm rounded-lg text-sm px-3 py-1">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[oklch(32.988%_0.05618_196.615)] text-white backdrop-blur-sm rounded-lg disabled:opacity-60 text-sm px-3 py-1">{isSubmitting ? "Adding..." : "Add Brand"}</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
