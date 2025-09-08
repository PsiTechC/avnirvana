//working condition of this code dont mess with this firdt code ever .

// components/create-quotation-dialog.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Search } from "lucide-react"

type Props = { open: boolean; onOpenChange: (v: boolean) => void }
type ClientOpt = { id: string; name: string; contactPerson?: string; email?: string }
type Line = {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  total: number
}
type Opt = { id: string; name: string }
type ProductRow = { _id: string; name: string; sku?: string; price?: number; isPOR?: boolean; status?: string }

export default function CreateQuotationDialog({ open, onOpenChange }: Props) {
  // Header meta
  const [quotationNumber, setQuotationNumber] = useState("")
  const [validUntil, setValidUntil] = useState("")
  const [dealerId, setDealerId] = useState("")
  const [notes, setNotes] = useState("")

  // Lines
  const [items, setItems] = useState<Line[]>([])
  const [discount, setDiscount] = useState<string>("")

  // Clients
  const [clients, setClients] = useState<ClientOpt[]>([])
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

  // Product picker
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerForLine, setPickerForLine] = useState<string | null>(null)
  const [brands, setBrands] = useState<Opt[]>([])
  const [categories, setCategories] = useState<Opt[]>([])
  const [functions, setFunctions] = useState<Opt[]>([])
  const [brandId, setBrandId] = useState("all")
  const [categoryId, setCategoryId] = useState("all")
  const [functionId, setFunctionId] = useState("all")
  const [q, setQ] = useState("")
  const [products, setProducts] = useState<ProductRow[]>([])
  const [prodLoading, setProdLoading] = useState(false)
  const [prodError, setProdError] = useState<string | null>(null)

  // load clients
  useEffect(() => {
    if (!open) return
    let dead = false
      ; (async () => {
        setClientsLoading(true)
        setClientsError(null)
        try {
          const res = await fetch("/api/dealers", { cache: "no-store" })
          if (!res.ok) throw new Error("Failed to load clients")
          const json = await res.json()
          const opts: ClientOpt[] = (json?.data ?? []).map((d: any) => ({
            id: d._id ?? d.id, name: d.name, contactPerson: d.contactPerson, email: d.email,
          }))
          if (!dead) setClients(opts)
        } catch (e: any) {
          if (!dead) setClientsError(e?.message ?? "Could not load clients")
        } finally {
          if (!dead) setClientsLoading(false)
        }
      })()
    return () => { dead = true }
  }, [open])

  // load picker options when opened
  useEffect(() => {
    if (!pickerOpen) return
    let dead = false
      ; (async () => {
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
        } catch {/* noop */ }
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

  // lines
  const addLine = () => {
    const id = String(Date.now())
    setItems(prev => [...prev, { id, productId: "", productName: "", quantity: 1, unitPrice: 0, total: 0 }])
    // open picker for this line
    setPickerForLine(id)
    setBrandId("all"); setCategoryId("all"); setFunctionId("all"); setQ("")
    setProducts([]); setProdError(null)
    setPickerOpen(true)
  }
  const removeLine = (id: string) => setItems(prev => prev.filter(l => l.id !== id))
  const updateLine = (id: string, field: keyof Line, value: string | number) => {
    setItems(prev => prev.map(l => {
      if (l.id !== id) return l
      const next: Line = { ...l, [field]: value } as any
      if (field === "quantity" || field === "unitPrice") {
        next.total = (Number(next.quantity) || 0) * (Number(next.unitPrice) || 0)
      }
      return next
    }))
  }
  const chooseProduct = (p: ProductRow) => {
    if (!pickerForLine) return
    setItems(prev => prev.map(l => {
      if (l.id !== pickerForLine) return l
      const price = p.isPOR ? 0 : (typeof p.price === "number" ? p.price : 0)
      return { ...l, productId: p._id, productName: p.name, unitPrice: price, total: (l.quantity || 0) * price }
    }))
    setPickerOpen(false)
    setPickerForLine(null)
  }

  // totals
  const subtotal = useMemo(() => items.reduce((s, l) => s + (l.total || 0), 0), [items])
  const tax = subtotal * 0.18
  const discountNum = Math.max(0, Number(discount || 0))
  const grandTotal = Math.max(0, subtotal + tax - discountNum)

  // save quotation
  const saveQuotation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dealerId || !validUntil || !quotationNumber || items.length === 0) return

    // Prepare input for API (server re-computes all money fields)
    const body = {
      quotationNumber,
      dealerId,
      validUntil,
      notes: notes || undefined,
      discount: discountNum || 0,
      items: items.map(({ productId, productName, quantity, unitPrice }) => ({
        productId, productName, quantity, unitPrice,
      })),
    }

    const res = await fetch("/api/quotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const maybe = await res.json().catch(() => null)
      alert(maybe?.error || "Failed to create quotation")
      return
    }

    // reset
    setQuotationNumber("")
    setValidUntil("")
    setDealerId("")
    setNotes("")
    setItems([])
    setDiscount("")

    onOpenChange(false)
  }

  // add client (multipart)
  const submitClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (clientSaving) return
    setClientError(null)
    setClientSaving(true)
    try {
      const fd = new FormData()
      fd.append("name", clientForm.name.trim())
      if (clientForm.contactPerson) fd.append("contactPerson", clientForm.contactPerson.trim())
      if (clientForm.phone) fd.append("phone", clientForm.phone.trim())
      if (clientForm.mobile) fd.append("mobile", clientForm.mobile.trim())
      if (clientForm.email) fd.append("email", clientForm.email.trim())
      if (clientForm.address) fd.append("address", clientForm.address.trim())
      if (clientForm.city) fd.append("city", clientForm.city.trim())
      if (clientForm.pincode) fd.append("zipCode", clientForm.pincode.trim())

      const res = await fetch("/api/dealers", { method: "POST", body: fd })
      if (!res.ok) {
        const maybe = await res.json().catch(() => null)
        throw new Error(maybe?.error || "Failed to create client")
      }
      const { data } = await res.json()
      const added: ClientOpt = { id: data._id ?? data.id, name: data.name, contactPerson: data.contactPerson, email: data.email }
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

  const selectedClient = clients.find(c => c.id === dealerId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[980px] max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader><DialogTitle className="font-serif">Create New Quotation</DialogTitle></DialogHeader>

        <form onSubmit={saveQuotation} className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader><CardTitle className="text-lg font-serif">Quotation Info</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Quotation # *</Label>
                <Input value={quotationNumber} onChange={(e) => setQuotationNumber(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Valid Until *</Label>
                <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Client *</Label>
                <div className="flex gap-2">
                  <Select value={dealerId} onValueChange={setDealerId} disabled={clientsLoading || !!clientsError}>
                    <SelectTrigger><SelectValue placeholder={clientsLoading ? "Loading…" : "Select client"} /></SelectTrigger>
                    <SelectContent>
                      {clientsError && <div className="px-3 py-2 text-sm text-red-500">{clientsError}</div>}
                      {!clientsError && clients.length === 0 && !clientsLoading && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No clients</div>
                      )}
                      {/* {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)} */}
                      {clients.filter(c => c.id && c.id !== "").map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={() => setAddClientOpen(true)}><Plus className="h-4 w-4 mr-1" />Add</Button>
                </div>
                {selectedClient && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {selectedClient.contactPerson ? `Contact: ${selectedClient.contactPerson}` : null}
                    {selectedClient.email ? ` • ${selectedClient.email}` : null}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg font-serif">Products</CardTitle>
              <Button type="button" onClick={addLine} className="bg-accent hover:bg-accent/90"><Plus className="h-4 w-4 mr-1" />Add Product</Button>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No items yet.</p>
              ) : (
                <div className="space-y-4">
                  {items.map(l => (
                    <div key={l.id} className="flex items-end gap-4 p-4 border rounded-md">
                      <div className="flex-1">
                        <Label>Product</Label>
                        <div className="flex gap-2">
                          <Input value={l.productName || ""} disabled placeholder="Pick a product…" />
                          <Button type="button" variant="outline" onClick={() => {
                            setPickerForLine(l.id)
                            setBrandId("all"); setCategoryId("all"); setFunctionId("all"); setQ("")
                            setProducts([]); setProdError(null)
                            setPickerOpen(true)
                          }}>Choose</Button>
                        </div>
                      </div>
                      <div className="w-24">
                        <Label>Qty</Label>
                        <Input type="number" min={1} value={l.quantity} onChange={(e) => updateLine(l.id, "quantity", Number(e.target.value) || 1)} />
                      </div>
                      <div className="w-32">
                        <Label>Unit Price</Label>
                        <Input type="number" step="0.01" value={l.unitPrice} onChange={(e) => updateLine(l.id, "unitPrice", Number(e.target.value) || 0)} />
                      </div>
                      <div className="w-32">
                        <Label>Total</Label>
                        <Input value={`Rs ${l.total.toFixed(2)}`} disabled />
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => removeLine(l.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          {items.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg font-serif">Summary</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between"><span>Subtotal:</span><span>Rs {subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Tax (18%):</span><span>Rs {tax.toFixed(2)}</span></div>
                <div className="flex items-center justify-between gap-4">
                  <span>Discount (Rs):</span>
                  <Input className="w-40" type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0.00" />
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Grand Total:</span><span>Rs {grandTotal.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Terms / comments…" />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={!dealerId || !validUntil || !quotationNumber || items.length === 0}>Save Quotation</Button>
          </div>
        </form>
      </DialogContent>

      {/* Add Client Modal */}
      <Dialog open={addClientOpen} onOpenChange={setAddClientOpen}>
        <DialogContent className="sm:max-w-[520px] bg-white">
          <DialogHeader><DialogTitle className="font-serif">Add Client</DialogTitle></DialogHeader>
          <form onSubmit={submitClient} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Name *</Label><Input required value={clientForm.name} onChange={(e) => setClientForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Contact Person</Label><Input value={clientForm.contactPerson} onChange={(e) => setClientForm(p => ({ ...p, contactPerson: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={clientForm.phone} onChange={(e) => setClientForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Mobile</Label><Input value={clientForm.mobile} onChange={(e) => setClientForm(p => ({ ...p, mobile: e.target.value }))} /></div>
              <div className="space-y-2 md:col-span-2"><Label>Email</Label><Input type="email" value={clientForm.email} onChange={(e) => setClientForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div className="space-y-2 md:col-span-2"><Label>Full Address</Label>
                <Textarea
                  rows={3}
                  value={clientForm.address}
                  onChange={(e) => setClientForm(p => ({ ...p, address: e.target.value }))}
                  style={{ maxHeight: "120px", overflowY: "auto", resize: "vertical" }}
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

      {/* Product Picker */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-[860px] max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader><DialogTitle className="font-serif">Select Product</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div><Label>Brand</Label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {/* {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)} */}
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
                  {/* {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)} */}
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
                  {/* {functions.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)} */}
                  {functions.filter(f => f.id && f.id !== "").map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or SKU…" />
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
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 w-28">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 && !prodLoading ? (
                  <tr><td className="px-3 py-4 text-muted-foreground" colSpan={5}>No results yet.</td></tr>
                ) : products.map(p => (
                  <tr key={p._id} className="border-t">
                    <td className="px-3 py-2">{p.name}</td>
                    <td className="px-3 py-2">{p.sku || "—"}</td>
                    <td className="px-3 py-2">{p.isPOR ? "POR" : (typeof p.price === "number" ? `Rs ${p.price.toFixed(2)}` : "—")}</td>
                    <td className="px-3 py-2 capitalize">{p.status || "—"}</td>
                    <td className="px-3 py-2">
                      <Button size="sm" type="button" onClick={() => chooseProduct(p)}>Select</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

