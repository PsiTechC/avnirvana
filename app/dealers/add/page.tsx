"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X } from "lucide-react"
import Image from "next/image"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function AddDealerPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () =>
    setFormData({
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
      logo: null,
      logoPreview: "",
    })

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

      const res = await fetch("/api/dealers", { method: "POST", body: fd })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Create failed" }))
        throw new Error(error || "Create failed")
      }

      resetForm()
      router.push("/dealers")
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6">
        <Card className="max-w-3xl mx-auto border border-blue-200 shadow-sm  bg-[oklch(98%_0.01_220)]/80">
          <CardHeader>
            <CardTitle className="text-3xl font-bold tracking-tight mb-2">Add New Dealer</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main fields */}
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Dealer Name *</Label>
                      <Input id="name" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson">Contact Person</Label>
                      <Input id="contactPerson" value={formData.contactPerson} onChange={(e) => handleChange("contactPerson", e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea id="address" value={formData.address} onChange={(e) => handleChange("address", e.target.value)} className="h-24 max-h-40 overflow-y-auto resize-none" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input id="city" value={formData.city} onChange={(e) => handleChange("city", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input id="state" value={formData.state} onChange={(e) => handleChange("state", e.target.value)}  />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Zip Code</Label>
                      <Input id="zipCode" value={formData.zipCode} onChange={(e) => handleChange("zipCode", e.target.value)} />
                    </div>
                  </div>
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
                      <Label htmlFor="territory">Territory </Label>
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
                <div className="w-full md:w-48 flex flex-col items-center space-y-2 mt-6 md:mt-0">
                  <Label>Dealer Logo (optional)</Label>
                  {formData.logoPreview ? (
                    <div className="relative">
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                        <Image
                          src={formData.logoPreview}
                          alt="Dealer logo preview"
                          fill
                          sizes="96px"
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
                      className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors focus:outline-none focus:ring-2"
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
                  {isSubmitting ? "Adding..." : "Add Dealer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
