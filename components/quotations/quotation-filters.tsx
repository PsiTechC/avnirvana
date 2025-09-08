
// components/quotation-filters.tsx
"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Props = {
  onChange: (v: { status?: string; q?: string }) => void
}

export default function QuotationFilters({ onChange }: Props) {
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [q, setQ] = useState<string>("")

  return (
    <div className="flex bg-white flex-wrap gap-3">
      <div className="w-40">
        <Select
          value={status ?? ""}
          onValueChange={(v) => { const s = v || undefined; setStatus(s); onChange({ status: s, q }) }}
        >
          <SelectTrigger><SelectValue placeholder="All status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Sent">Sent</SelectItem>
            <SelectItem value="Accepted">Accepted</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Input
        className="max-w-xs"
        placeholder="Search # or notes…"
        value={q}
        onChange={(e) => { const v = e.target.value; setQ(v); onChange({ status, q: v }) }}
      />
    </div>
  )
}
