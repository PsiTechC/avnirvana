"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Building2, Upload } from "lucide-react"

export function CompanySettings() {
  const [companyData, setCompanyData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: "",
    email: "",
    website: "",
    gstin: "",
    description: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Load company info on mount
  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch("/api/company")
      .then((r) => r.json())
      .then((res) => {
        if (res.ok && res.data) setCompanyData(res.data)
        setLoading(false)
      })
      .catch(() => {
        setError("Failed to load company info")
        setLoading(false)
      })
  }, [])

  const handleChange = (field: string, value: string) => {
    setCompanyData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    fetch("/api/company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(companyData),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) setSuccess(true)
        else setError(res.error || "Failed to save company info")
        setLoading(false)
      })
      .catch(() => {
        setError("Failed to save company info")
        setLoading(false)
      })
  }

  return (
    <div className="space-y-6">
      {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
      {error && <div className="text-sm text-red-500">{error}</div>}
      {success && <div className="text-sm text-green-600">Company info saved!</div>}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center">
            <Building2 className="mr-2 h-5 w-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name *</Label>
              <Input id="company-name" value={companyData.name} onChange={(e) => handleChange("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-id">GSTIN</Label>
              <Input id="tax-id" value={companyData.gstin} onChange={(e) => handleChange("gstin", e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input id="address" value={companyData.address} onChange={(e) => handleChange("address", e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input id="city" value={companyData.city} onChange={(e) => handleChange("city", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input id="state" value={companyData.state} onChange={(e) => handleChange("state", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">Zip Code *</Label>
              <Input id="zip" value={companyData.zipCode} onChange={(e) => handleChange("zipCode", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input id="country" value={companyData.country} onChange={(e) => handleChange("country", e.target.value)} placeholder="Enter country" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" value={companyData.phone} onChange={(e) => handleChange("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={companyData.email} onChange={(e) => handleChange("email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={companyData.website} onChange={(e) => handleChange("website", e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Company Description</Label>
            <Textarea
              id="description"
              value={companyData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              style={{ maxHeight: "120px", overflowY: "auto", resize: "vertical" }}
              className="overflow-y-auto resize-vertical"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} className="bg-[oklch(32.988%_0.05618_196.615)] text-white hover:bg-[oklch(32.988%_0.05618_196.615)]/90">
              Save Company Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      
      
    </div>
  )
}
