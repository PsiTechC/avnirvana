"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Plus } from "lucide-react"
import {DashboardLayout} from "@/components/dashboard-layout"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
//import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Trash2 } from "lucide-react"

export default function AddQuotationPage() {
  const router = useRouter()
  // Header meta
  const [quotationNumber, setQuotationNumber] = useState("")
  const [validUntil, setValidUntil] = useState("")
  const [dealerId, setDealerId] = useState("")
  const [notes, setNotes] = useState("")

  // Area Room Types
  const [areas, setAreas] = useState<any[]>([])
  const [areasLoading, setAreasLoading] = useState(false)
  const [areasError, setAreasError] = useState<string | null>(null)
  // Each area: { id, areaRoomTypeId, areaRoomTypeName, items: [...] }
  const [areaSections, setAreaSections] = useState<any[]>([])
  const [discount, setDiscount] = useState<string>("")
  // Load area room types
  useEffect(() => {
    let dead = false
    ;(async () => {
      setAreasLoading(true)
      setAreasError(null)
      try {
        const res = await fetch("/api/area-room-types", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load area room types")
        const json = await res.json()
        const opts = (json?.data ?? []).map((d: any) => ({ id: d._id ?? d.id, name: d.name }))
        if (!dead) setAreas(opts)
      } catch (e: any) {
        if (!dead) setAreasError(e?.message ?? "Could not load area room types")
      } finally {
        if (!dead) setAreasLoading(false)
      }
    })()
    return () => { dead = true }
  }, [])

  // Clients
  const [clients, setClients] = useState<any[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [clientsError, setClientsError] = useState<string | null>(null)
  // Add client modal
  const [addClientOpen, setAddClientOpen] = useState(false)
  const [clientSaving, setClientSaving] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)
  const [clientForm, setClientForm] = useState({
    name: "", contactPerson: "", phone: "", mobile: "", email: "",
    address: "", city: "", pincode: "",
  })

  // Product picker modal
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerForLine, setPickerForLine] = useState<string | null>(null)
  const [brands, setBrands] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [functions, setFunctions] = useState<any[]>([])
  const [brandId, setBrandId] = useState("all")
  const [categoryId, setCategoryId] = useState("all")
  const [functionId, setFunctionId] = useState("all")
  const [q, setQ] = useState("")
  const [products, setProducts] = useState<any[]>([])
  const [prodLoading, setProdLoading] = useState(false)
  const [prodError, setProdError] = useState<string | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load clients
  useEffect(() => {
    let dead = false
    ;(async () => {
      setClientsLoading(true)
      setClientsError(null)
      try {
        const res = await fetch("/api/clients", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load clients")
        const json = await res.json()
        const opts = (json?.data ?? []).map((d: any) => ({ id: d._id ?? d.id, name: d.name, contactPerson: d.contactPerson, email: d.email }))
        if (!dead) setClients(opts)
      } catch (e: any) {
        if (!dead) setClientsError(e?.message ?? "Could not load clients")
      } finally {
        if (!dead) setClientsLoading(false)
      }
    })()
    return () => { dead = true }
  }, [])

  // Add client submit
  const submitClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (clientSaving) return
    setClientError(null)
    setClientSaving(true)
    try {
      const payload: any = {
        name: clientForm.name.trim(),
        contactPerson: clientForm.contactPerson.trim() || undefined,
        phone: clientForm.phone.trim() || undefined,
        mobile: clientForm.mobile.trim() || undefined,
        email: clientForm.email.trim() || undefined,
        address: clientForm.address.trim() || undefined,
        city: clientForm.city.trim() || undefined,
        zipCode: clientForm.pincode.trim() || undefined,
      }
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const maybe = await res.json().catch(() => null)
        throw new Error(maybe?.error || "Failed to create client")
      }
      const { data } = await res.json()
      const added = { id: data._id ?? data.id, name: data.name, contactPerson: data.contactPerson, email: data.email }
      setClients(prev => [...prev, added])
      setDealerId(added.id)
      setAddClientOpen(false)
      setClientForm({ name: "", contactPerson: "", phone: "", mobile: "", email: "", address: "", city: "", pincode: "" })
    } catch (err: any) {
      setClientError(err?.message ?? "Something went wrong")
    } finally {
      setClientSaving(false)
    }
  }

  // Product picker options
  useEffect(() => {
    if (!pickerOpen) return
    let dead = false
    ;(async () => {
      try {
        const [b, c, f] = await Promise.all([
          fetch("/api/brands", { cache: "no-store" }).then(r => r.json()).catch(() => ({ data: [] })),
          fetch("/api/product-categories", { cache: "no-store" }).then(r => r.json()).catch(() => ({ data: [] })),
          fetch("/api/product-function", { cache: "no-store" }).then(r => r.json()).catch(() => ({ data: [] })),
        ])
        if (!dead) {
          setBrands((b?.data ?? []).map((x: any) => ({ id: x._id, name: x.name })))
          setCategories((c?.data ?? []).map((x: any) => ({ id: x._id, name: x.name })))
          setFunctions((f?.data ?? []).map((x: any) => ({ id: x._id, name: x.name })))
        }
      } catch {/* noop */}
    })()
    return () => { dead = true }
  }, [pickerOpen])

  const fetchProducts = async () => {
    setProdLoading(true); setProdError(null); setProducts([])
    try {
      const qs = new URLSearchParams()
      if (brandId !== "all") qs.set("brandId", brandId)
      if (categoryId !== "all") qs.set("categoryId", categoryId)
      if (functionId !== "all") qs.set("functionId", functionId)
      if (q.trim()) qs.set("q", q.trim())
      const res = await fetch(`/api/products?${qs.toString()}`, { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load products")
      const json = await res.json()
      setProducts(json?.data ?? [])
    } catch (e: any) {
      setProdError(e?.message ?? "Could not load products")
    } finally {
      setProdLoading(false)
    }
  }

  // Area section product lines
  const addAreaSection = () => {
    setAreaSections(prev => [
      ...prev,
      {
        id: String(Date.now()),
        areaRoomTypeId: "",
        areaRoomTypeName: "",
        items: []
      }
    ])
  }
  const removeAreaSection = (id: string) => setAreaSections(prev => prev.filter(a => a.id !== id))
  const setAreaForSection = (sectionId: string, areaRoomTypeId: string) => {
    const area = areas.find((a: any) => a.id === areaRoomTypeId)
    setAreaSections(prev => prev.map(a => a.id === sectionId ? { ...a, areaRoomTypeId, areaRoomTypeName: area?.name || "" } : a))
  }
  const addLineToArea = (sectionId: string) => {
    setAreaSections(prev => prev.map(a => {
      if (a.id !== sectionId) return a
      const id = String(Date.now())
      return {
        ...a,
        items: [...a.items, { id, productId: "", productName: "", quantity: 1, unitPrice: 0, total: 0 }]
      }
    }))
    setPickerForLine(sectionId + "-" + Date.now())
    setBrandId("all"); setCategoryId("all"); setFunctionId("all"); setQ("")
    setProducts([]); setProdError(null)
    setPickerOpen(true)
  }
  const removeLineFromArea = (sectionId: string, lineId: string) => {
    setAreaSections(prev => prev.map(a => a.id === sectionId ? { ...a, items: a.items.filter((l: any) => l.id !== lineId) } : a))
  }
  const updateLineInArea = (sectionId: string, lineId: string, field: string, value: string | number) => {
    setAreaSections(prev => prev.map(a => {
      if (a.id !== sectionId) return a
      return {
        ...a,
        items: a.items.map((l: any) => {
          if (l.id !== lineId) return l
          const next = { ...l, [field]: value }
          if (field === "quantity" || field === "unitPrice") {
            next.total = (Number(next.quantity) || 0) * (Number(next.unitPrice) || 0)
          }
          return next
        })
      }
    }))
  }
  const chooseProductForArea = (sectionId: string, lineId: string, p: any) => {
    setAreaSections(prev => prev.map(a => {
      if (a.id !== sectionId) return a
      return {
        ...a,
        items: a.items.map((l: any) => {
          if (l.id !== lineId) return l
          const price = typeof p.price === "number" ? p.price : 0
          return { ...l, productId: p._id, productName: p.name, unitPrice: price, total: (l.quantity || 0) * price }
        })
      }
    }))
    setPickerOpen(false)
    setPickerForLine(null)
  }

  // totals
  const subtotal = useMemo(() => areaSections.reduce((sum: number, a: any) => sum + a.items.reduce((s: number, l: any) => s + (l.total || 0), 0), 0), [areaSections])
  const tax = subtotal * 0.18
  const discountNum = Math.max(0, Number(discount || 0))
  const grandTotal = Math.max(0, subtotal + tax - discountNum)

  // save quotation
  const saveQuotation = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    // Validation: require at least one product per area
    if (!dealerId || !validUntil || !quotationNumber || areaSections.length === 0) {
      setError("Please fill all required fields and add at least one area.")
      return
    }
    for (const area of areaSections) {
      if (!area.areaRoomTypeId || !area.areaRoomTypeName) {
        setError("Please select an area room type for each area.")
        return
      }
      if (!Array.isArray(area.items) || area.items.length === 0) {
        setError("Each area must have at least one product.")
        return
      }
    }
    // Convert validUntil string (yyyy-mm-dd) to Date object for API
    const validUntilDate = validUntil ? new Date(validUntil) : null
    // Prepare input for API
    const body = {
      quotationNumber,
      dealerId,
      validUntil: validUntilDate,
      notes: notes || undefined,
      discount: discountNum || 0,
      areas: areaSections.map((area: any) => ({
        areaRoomTypeId: area.areaRoomTypeId,
        areaRoomTypeName: area.areaRoomTypeName,
        items: Array.isArray(area.items)
          ? area.items
              .filter((item: any) => item.productId && item.productName)
              .map((item: any) => {
                const { productId, productName, quantity, unitPrice } = item;
                return { productId, productName, quantity, unitPrice };
              })
          : []
      }))
    }
    const res = await fetch("/api/quotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const maybe = await res.json().catch(() => null)
      setError(maybe?.error || "Failed to create quotation")
      return
    }
    // reset
    setQuotationNumber("")
    setValidUntil("")
    setDealerId("")
    setNotes("")
    setAreaSections([])
    setDiscount("")
    router.push("/quotations")
  }

  return (
    <DashboardLayout>
      <form onSubmit={saveQuotation}>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold  text-[oklch(35.04%_0.01007_216.95)]">Add New Quotation</h1>
              <p className="text-sm font-bold  text-[oklch(57.951%_0.00007_271.152)]">Fill in the details below</p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Left: details */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1">
                  <Label className="text-l font-bold text-[oklch(35.04%_0.01007_216.95)]">Quotation #</Label>
                  <Input value={quotationNumber} onChange={(e) => setQuotationNumber(e.target.value)} required maxLength={120} className="bg-white/20 border-white/30 text-black placeholder-white/60 backdrop-blur-sm rounded-lg text-sm py-1.5 px-2" />
                </div>
                <div className="grid gap-1">
                  <Label className="text-l font-bold text-[oklch(35.04%_0.01007_216.95)]">Valid Until</Label>
                  <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} required className="bg-white/20 border-white/30 text-black placeholder-white/60 backdrop-blur-sm rounded-lg text-sm py-1.5 px-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1">
                  <Label className="text-l font-bold text-[oklch(35.04%_0.01007_216.95)]">Client</Label>
                  <div className="flex gap-2 items-center">
                    <Select value={dealerId} onValueChange={setDealerId} disabled={clientsLoading || !!clientsError}>
                      <SelectTrigger><SelectValue placeholder="Choose client" /></SelectTrigger>
                      <SelectContent>
                        {clients.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" onClick={() => setAddClientOpen(true)}><Plus className="h-4 w-4 mr-1" />Add</Button>
                  </div>
                  {(() => {
                    const selected = clients.find((c: any) => c.id === dealerId)
                    if (!selected) return null
                    return (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {selected.contactPerson ? `Contact: ${selected.contactPerson}` : null}
                        {selected.email ? ` • ${selected.email}` : null}
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Add Client Modal */}
              <Dialog open={addClientOpen} onOpenChange={setAddClientOpen}>
                <DialogContent className="sm:max-w-[520px] bg-white/50 backdrop-blur-lg">
                  <DialogHeader><DialogTitle >Add Client</DialogTitle></DialogHeader>
                  <form onSubmit={submitClient} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2"><Label>Name *</Label><Input required value={clientForm.name} onChange={(e) => setClientForm(p => ({ ...p, name: e.target.value }))} /></div>
                      <div className="space-y-2"><Label>Contact Person</Label><Input value={clientForm.contactPerson} onChange={(e) => setClientForm(p => ({ ...p, contactPerson: e.target.value }))} /></div>
                      <div className="space-y-2"><Label>Phone</Label><Input value={clientForm.phone} onChange={(e) => setClientForm(p => ({ ...p, phone: e.target.value }))} /></div>
                      <div className="space-y-2"><Label>Mobile</Label><Input value={clientForm.mobile} onChange={(e) => setClientForm(p => ({ ...p, mobile: e.target.value }))} /></div>
                      <div className="space-y-2 md:col-span-2"><Label>Email</Label><Input type="email" value={clientForm.email} onChange={(e) => setClientForm(p => ({ ...p, email: e.target.value }))} /></div>
                      <div className="space-y-2 md:col-span-2"><Label>Full Address</Label>
                        <Textarea
                          rows={4}
                          value={clientForm.address}
                          onChange={(e) => setClientForm(p => ({ ...p, address: e.target.value }))}
                          style={{ maxHeight: "85px", overflowY: "auto", resize: "vertical" }}
                          className="overflow-y-auto resize-vertical"
                        />
                      </div>
                      <div className="space-y-2"><Label>City</Label><Input value={clientForm.city} onChange={(e) => setClientForm(p => ({ ...p, city: e.target.value }))} /></div>
                      <div className="space-y-2"><Label>Pincode</Label><Input value={clientForm.pincode} onChange={(e) => setClientForm(p => ({ ...p, pincode: e.target.value }))} /></div>
                    </div>
                    {clientError && <p className="text-sm text-red-500">{clientError}</p>}
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setAddClientOpen(false)} disabled={clientSaving}>Cancel</Button>
                      <Button type="submit" disabled={clientSaving}>{clientSaving ? "Saving…" : "Save Client"}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              {/* Area Room Type Sections */}
              <div className="space-y-6">
                {areaSections.map((section, idx) => (
                  <Card key={section.id} className="border border-blue-200">
                    <CardHeader className="flex items-center justify-between">
                      <div className="flex gap-2 items-center">
                        <Label className="text-l font-bold text-[oklch(35.04%_0.01007_216.95)]">Area Room Type</Label>
                        <Select value={section.areaRoomTypeId} onValueChange={v => setAreaForSection(section.id, v)}>
                          <SelectTrigger className="w-56 bg-white">
                            <SelectValue placeholder={areasLoading ? "Loading..." : "Select area room type"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {areasError && <div className="px-3 py-2 text-sm text-red-500">{areasError}</div>}
                            {!areasError && areas.length === 0 && !areasLoading && (
                              <div className="px-3 py-2 text-sm text-muted-foreground">No area room types found</div>
                            )}
                            <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                              {areas.map(a => (
                                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                              ))}
                            </div>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="button" variant="outline" onClick={() => removeAreaSection(section.id)} className="text-red-500 border-red-200">Remove Area</Button>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-md text-[oklch(35.04%_0.01007_216.95)]">Products for this Area</CardTitle>
                        <Button type="button" onClick={() => addLineToArea(section.id)} className="bg-accent hover:bg-accent/90"><Plus className="h-4 w-4 mr-1" />Add Product</Button>
                      </div>
                      {section.items.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No products for this area yet.</p>
                      ) : (
                        <>
                          <div className="flex font-semibold text-xs text-muted-foreground px-4 pb-2">
                            <div className="w-1/3">Product</div>
                            <div className="w-20">Quantity</div>
                            <div className="w-28">Unit Price</div>
                            <div className="w-28">Total</div>
                            <div className="w-24">Action</div>
                          </div>
                          <div className="space-y-4">
                            {section.items.map((l: any) => (
                              <div key={l.id} className="flex items-end gap-4 p-4 border rounded-md">
                                <Input className="w-1/3" value={l.productName} readOnly placeholder="Product" />
                                <Input className="w-20" type="number" min={1} value={l.quantity} onChange={e => updateLineInArea(section.id, l.id, "quantity", Number(e.target.value))} placeholder="Qty" />
                                <Input className="w-28" type="number" min={0} value={l.unitPrice} onChange={e => updateLineInArea(section.id, l.id, "unitPrice", Number(e.target.value))} placeholder="Unit Price" />
                                <Input className="w-28" value={l.total} readOnly placeholder="Total" />
                                <Button type="button" variant="outline" onClick={() => removeLineFromArea(section.id, l.id)} className="text-red-500 border-red-200">Remove</Button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
                <Button type="button" onClick={addAreaSection} className="bg-[oklch(32.988%_0.05618_196.615)] text-white hover:bg-[oklch(32.988%_0.05618_196.615)]/80 font-bold"><Plus className="h-4 w-4 mr-1" />Add Area Room Type</Button>
              </div>

              {/* Product Picker Modal */}
              <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
                <DialogContent className="sm:max-w-[860px] max-h-[90vh] overflow-y-auto bg-white/60 backdrop-blur-lg">
                  <DialogHeader><DialogTitle>Select Product</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div><Label>Brand</Label>
                      <Select value={brandId} onValueChange={setBrandId}>
                        <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {brands.filter(b => b.id && b.id !== "").map(b => (
                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Category</Label>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {categories.filter(c => c.id && c.id !== "").map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Function</Label>
                      <Select value={functionId} onValueChange={setFunctionId}>
                        <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {functions.filter(f => f.id && f.id !== "").map(f => (
                            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Search</Label>
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name of Product.." />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button onClick={fetchProducts} disabled={prodLoading}>{prodLoading ? "Searching…" : "Search"}</Button>
                  </div>

                  {prodError && <div className="text-sm text-red-500">{prodError}</div>}

                  <div className="overflow-x-auto rounded-md border mt-3">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr className="text-left">
                          <th className="px-3 py-2">Name</th>
                          <th className="px-3 py-2">Price</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2 w-28">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.length === 0 && !prodLoading ? (
                          <tr><td className="px-3 py-4 text-muted-foreground" colSpan={5}>No results yet.</td></tr>
                        ) : products.map((p: any) => (
                          <tr key={p._id} className="border-t">
                            <td className="px-3 py-2">{p.name}</td>
                            <td className="px-3 py-2">{p.isPOR ? "POR" : (typeof p.price === "number" ? `Rs ${p.price.toFixed(2)}` : "—")}</td>
                            <td className="px-3 py-2 capitalize">{p.status || "—"}</td>
                            <td className="px-3 py-2">
                              <Button type="button" onClick={() => {
                                // Find the section and line for which the picker is open
                                if (pickerForLine) {
                                  const [sectionId, lineId] = pickerForLine.split("-");
                                  chooseProductForArea(sectionId, lineId, p);
                                }
                              }}>
                                Add Product
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </DialogContent>
              </Dialog>
              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Terms / comments…" />
              </div>
            </div>
            {/* Right: summary and actions */}
            <aside className="md:col-span-1">
              <div style={{ position: 'sticky', top: 100, zIndex: 10 }}>
              <div className="rounded-lg border bg-muted/20 p-3">
                <div className="space-y-2">
                  <div className="flex justify-between"><span>Subtotal:</span><span>Rs {subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Tax (18%):</span><span>Rs {tax.toFixed(2)}</span></div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Discount (Rs):</span>
                    <Input className="w-24" type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0.00" />
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Grand Total:</span><span>Rs {grandTotal.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-20">
                    <Button type="button" onClick={() => router.push("/quotations")} className="bg-white text-[oklch(0%_0_0)] hover:bg-[oklch(0.577_0.245_27.325)]/80 backdrop-blur-sm rounded-lg text-sm px-3 py-1">Cancel</Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-[oklch(32.988%_0.05618_196.615)] hover:bg-[oklch(32.988%_0.05618_196.615)]/80 text-white backdrop-blur-sm rounded-lg disabled:opacity-60 text-sm px-3 py-1">{isSubmitting ? "Adding..." : "Add Quotation"}</Button>
                </div>
              </div>
              {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
            </div>
            </aside>
          </div>
        </div>
      </form>
    </DashboardLayout>
  )
}
