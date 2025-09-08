// app/(dashboard)/quotations/page.tsx
"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import QuotationFilters from "@/components/quotations/quotation-filters"
import QuotationGrid from "@/components/quotations/quotation-grid"
import CreateQuotationDialog from "@/components/quotations/create-quotation-dialog"
//import { EditQuotationDialog } from "@/components/quotations/edit-quotation-dialog"
import DeleteQuotationDialog from "@/components/quotations/delete-quotation-dialog"
import ViewQuotationDialog from "@/components/quotations/view-quotation-dialog"
import type { Quotation } from "@/components/quotations/quotation-card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
export default function QuotationsPage() {
  const router = useRouter()
  const [filters, setFilters] = useState<{ status?: string; q?: string }>({})
  const [openCreate, setOpenCreate] = useState(false)
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // dialog state
  const [viewing, setViewing] = useState<Quotation | null>(null)
  const [editing, setEditing] = useState<Quotation | null>(null)
  const [deleting, setDeleting] = useState<Quotation | null>(null)

  // bump to force Grid re-fetch after edits/deletes
  const [bump, setBump] = useState(0)
  const refetch = () => setBump((x) => x + 1)

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/quotations", { cache: "no-store", credentials: "include" });
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (!res.ok) throw new Error("Failed to load quotations");
        const json = await res.json();
        const list = (json?.data ?? []).map((q: any) => ({
          ...q,
          id: q.id ?? q._id,
          dealerName: q.dealerName ?? q.dealer?.name ?? "—",
          contactPerson: q.contactPerson ?? q.dealer?.contactPerson,
          email: q.email ?? q.dealer?.email,
          phone: q.phone ?? q.dealer?.phone,
          status: q.status ?? "",
          createdAt: q.createdAt ?? q.createdDate ?? "",
          validUntil: q.validUntil,
          items: q.items ?? [],
          subtotal: q.subtotal ?? 0,
          tax: q.tax ?? 0,
          discount: q.discount ?? 0,
          total: q.total ?? 0,
          notes: q.notes ?? "",
          areas: q.areas ?? [],
        }));
        if (alive) setQuotations(list);
      } catch (e: any) {
        if (alive) setError(e?.message ?? "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[oklch(35.04%_0.01007_216.95)]">Quotations</h1>
          <Button className="bg-[oklch(32.988%_0.05618_196.615)] text-white hover:bg-[oklch(32.988%_0.05618_196.615)]/90" onClick={() => router.push("/quotations/add")}>
            <Plus className="mr-2 h-4 w-4" /> New Quotation
          </Button>
        </div>

        <QuotationFilters onChange={setFilters} />

        <QuotationGrid
          key={bump}
          status={filters.status}
          q={filters.q}
          onView={setViewing}
          onEdit={setEditing}
          onDelete={setDeleting}
          data={quotations}
        />

        <CreateQuotationDialog open={openCreate} onOpenChange={(v) => { setOpenCreate(v); if (!v) refetch() }} />

        <ViewQuotationDialog
          open={!!viewing}
          quotation={viewing}
          onOpenChange={(o) => !o && setViewing(null)}
        />

        <DeleteQuotationDialog
          quotation={deleting as any}
          open={!!deleting}
          onOpenChange={(open) => {
            if (!open) {
              setDeleting(null);
              refetch();
            }
          }}
          onDeleted={() => { setDeleting(null); refetch() }}
        />
      </div>
    </DashboardLayout>
  )
}
