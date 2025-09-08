"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"


import { Dispatch, SetStateAction } from "react"

interface DealerFiltersProps {
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  statusFilter: string;
  setStatusFilter: Dispatch<SetStateAction<string>>;
  typeFilter: string;
  setTypeFilter: Dispatch<SetStateAction<string>>;
  territoryFilter: string;
  setTerritoryFilter: Dispatch<SetStateAction<string>>;
}

export function DealerFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  territoryFilter,
  setTerritoryFilter,
}: DealerFiltersProps) {
  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setTypeFilter("all")
    setTerritoryFilter("all")
  }

  const hasActiveFilters = searchTerm || statusFilter !== "all" || typeFilter !== "all" || territoryFilter !== "all"

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search dealers by name, contact person, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Premium">Premium</SelectItem>
            <SelectItem value="Authorized">Authorized</SelectItem>
            <SelectItem value="Standard">Standard</SelectItem>
          </SelectContent>
        </Select>

        <Select value={territoryFilter} onValueChange={setTerritoryFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Territory" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Territories</SelectItem>
            <SelectItem value="Northeast">Northeast</SelectItem>
            <SelectItem value="Southeast">Southeast</SelectItem>
            <SelectItem value="Midwest">Midwest</SelectItem>
            <SelectItem value="Southwest">Southwest</SelectItem>
            <SelectItem value="West Coast">West Coast</SelectItem>
            <SelectItem value="Northwest">Northwest</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
