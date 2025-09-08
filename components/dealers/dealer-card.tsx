"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Phone, Mail, MapPin, User } from "lucide-react"
import Image from "next/image"

interface Dealer {
  id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  status: "Active" | "Inactive"
  registrationDate: string
  dealerType: "Authorized" | "Premium" | "Standard"
  territory: string
  logo?: string
}

interface DealerCardProps {
  dealer: Dealer
  onEdit: (dealer: Dealer) => void
  onDelete: (dealer: Dealer) => void
}

export function DealerCard({ dealer, onEdit, onDelete }: DealerCardProps) {
  const getStatusColor = (status: string) => {
    return status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Premium":
        return "bg-purple-100 text-purple-800"
      case "Authorized":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Make card clickable to open dealer detail page
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => window.location.href = `/dealers/${dealer.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {dealer.logo && (
              <Image
                src={dealer.logo || "/placeholder.svg"}
                alt={`${dealer.name} logo`}
                width={48}
                height={48}
                className="rounded-lg object-cover"
              />
            )}
            <div>
              <h3 className=" font- bold text-lg">{dealer.name}</h3>
              <p className="text-sm text-muted-foreground">{dealer.territory}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge className={getStatusColor(dealer.status)}>{dealer.status}</Badge>
          <Badge className={getTypeColor(dealer.dealerType)}>{dealer.dealerType}</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{dealer.contactPerson}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{dealer.email}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{dealer.phone}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">
              {dealer.city}, {dealer.state}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Registered: {new Date(dealer.registrationDate).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
