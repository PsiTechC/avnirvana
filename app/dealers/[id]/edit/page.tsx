"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X } from "lucide-react"
import Image from "next/image"

export default function EditDealerPage() {
  const router = useRouter()
  const params = useParams()
  const dealerId = params?.id as string
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    status: "Active",
    dealerType: "Standard",
    territory: "",
    logo: null as File | null,
    logoPreview: "",
  })

  // Prefetch dealer data
  useEffect(() => {
    (async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const res = await fetch(`/api/dealers/${dealerId}`)
        if (!res.ok) throw new Error("Failed to load dealer data")
        const { data } = await res.json()
        setFormData({
          name: data.name ?? "",
          contactPerson: data.contactPerson ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          city: data.city ?? "",
          state: data.state ?? "",
          zipCode: data.zipCode ?? "",
          status: data.status ?? "Active",
          dealerType: data.dealerType ?? "Standard",
          territory: data.territory ?? "",
          logo: null,
          logoPreview: data.logoUrl ?? "", // If you store logo as a URL
        })
      } catch (e: any) {
        setLoadError(e?.message ?? "Failed to load dealer")
      } finally {
        setLoading(false)
      }
    })()
  }, [dealerId])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setLogoError(null)
    if (!file) return

    const validTypes = ["image/png", "image/jpeg"]
    if (!validTypes.includes(file.type)) {
      setLogoError("Please upload a PNG or JPG image.")
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }
    const MAX_BYTES = 2 * 1024 * 1024 // 2MB
    if (file.size > MAX_BYTES) {
      setLogoError("File is too large. Max size is 2MB.")
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        logo: file,
        logoPreview: reader.result as string,
      }))
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setLogoError(null)
    setFormData((prev) => ({ ...prev, logo: null, logoPreview: "" }))
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    setLogoError(null)

    try {
      const fd = new FormData()
      fd.append("name", formData.name.trim())
      fd.append("contactPerson", formData.contactPerson.trim())
      fd.append("email", formData.email.trim())
      fd.append("phone", formData.phone.trim())
      fd.append("address", formData.address.trim())
      fd.append("city", formData.city.trim())
      fd.append("state", formData.state.trim())
      fd.append("zipCode", formData.zipCode.trim())
      fd.append("status", formData.status)
      fd.append("dealerType", formData.dealerType)
      fd.append("territory", formData.territory)
      if (formData.logo) fd.append("logo", formData.logo)
      // If logo is removed, signal backend to delete it
      if (!formData.logo && !formData.logoPreview) {
        fd.append("removeLogo", "true")
      }

      const res = await fetch(`/api/dealers/${dealerId}`, { method: "PATCH", body: fd })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Update failed" }))
        throw new Error(error || "Update failed")
      }

      router.push("/dealers")
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
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

  if (loadError) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-red-500">{loadError}</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6">
        <h1 className="text-3xl font-bold tracking-tight text-[oklch(0%_0_0)]  mb-2">Edit Dealer :</h1>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
          <div className="bg-white/70 rounded-xl shadow p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Form fields left */}
              <div className="flex-1 space-y-4">
                {/* Basic info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Dealer Name </Label>
                    <Input id="name" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person </Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => handleChange("contactPerson", e.target.value)}
                    />
                  </div>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">Address </Label>
                  <Textarea id="address" value={formData.address} onChange={(e) => handleChange("address", e.target.value)} className="h-24 max-h-40 overflow-y-auto resize-none" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={formData.city} onChange={(e) => handleChange("city", e.target.value)}  />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" value={formData.state} onChange={(e) => handleChange("state", e.target.value)}  />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input id="zipCode" value={formData.zipCode} onChange={(e) => handleChange("zipCode", e.target.value)} />
                  </div>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dealerType">Dealer Type</Label>
                    <Select value={formData.dealerType} onValueChange={(value) => handleChange("dealerType", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Premium">Premium</SelectItem>
                        <SelectItem value="Authorized">Authorized</SelectItem>
                        <SelectItem value="Standard">Standard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="territory">Territory</Label>
                    <Select value={formData.territory} onValueChange={(value) => handleChange("territory", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select territory" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Northeast">Northeast</SelectItem>
                        <SelectItem value="Southeast">Southeast</SelectItem>
                        <SelectItem value="Midwest">Midwest</SelectItem>
                        <SelectItem value="Southwest">Southwest</SelectItem>
                        <SelectItem value="West Coast">West Coast</SelectItem>
                        <SelectItem value="Northwest">Northwest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              {/* Dealer logo right */}
              <div className="w-full md:w-40 flex flex-col items-center space-y-2">
                <Label>Dealer Logo (optional)</Label>
                {formData.logoPreview ? (
                  <div className="relative">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                      <Image
                        src={formData.logoPreview}
                        alt="Dealer logo preview"
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white"
                      onClick={removeLogo}
                      aria-label="Remove logo"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label ="Upload dealer logo"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors focus:outline-none focus:ring-2"
                  >
                    <Upload className="h-8 w-8 mb-2" />
                      <span className="text-sm text-[oklch(0%_0_0)]">Click to upload logo</span>
                      <span className="text-xs text-[oklch(0%_0_0)]">PNG, JPG up to 2MB</span>
                  </div>
                )}
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {logoError && <p className="text-xs text-red-500">{logoError}</p>}
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" className="bg-white text-[oklch(0%_0_0)] hover:bg-[oklch(0.577_0.245_27.325)]/80" onClick={() => router.push("/dealers")}>Cancel</Button>
              <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
