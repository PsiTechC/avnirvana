"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface BrandFiltersProps {
  statusFilter: "all" | "active" | "inactive"
  onStatusFilterChange: (filter: "all" | "active" | "inactive") => void
  searchQuery: string
  onSearchQueryChange: (query: string) => void
}

export function BrandFilters({statusFilter,onStatusFilterChange,searchQuery,onSearchQueryChange,}: BrandFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex gap-2">
        <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => onStatusFilterChange("all")}>
          All Brands</Button>
        <Button variant={statusFilter === "active" ? "default" : "outline"} size="sm" onClick={() => onStatusFilterChange("active")}>
          Active </Button>
        <Button
          variant={statusFilter === "inactive" ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusFilterChange("inactive")}
        >
          Inactive
        </Button>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black h-4 w-4" />
          <Input
            placeholder="Search brands..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      
    </div>
  )
}
