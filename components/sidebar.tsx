
"use client"

import { cn } from "@/lib/utils"
import { LayoutDashboard, Package, Boxes, Home, PackageOpen, ReceiptIndianRupee, Building, Building2, Users, FileText, Settings, X, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {Button} from "./ui/button"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onSignOut?: () => void
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Brands", href: "/brands", icon: Building2 },
  { name: "Other Brands", href: "/other_brands", icon: Building },
  { name: "Products", href: "/products", icon: Package },
  { name: "Products List", href: "/products_list", icon: Boxes },
  { name: "Product Price List", href: "/product_price_list", icon: ReceiptIndianRupee },
  { name: "Other Products", href: "/other_products", icon: Boxes },
  { name: "Products Functions", href: "/product_functions", icon: PackageOpen },
  { name: "Products Categories", href: "/product_categories", icon: PackageOpen },
  { name: "Dealers", href: "/dealers", icon: Users },
  { name: "Quotations", href: "/quotations", icon: FileText },
  { name: "Area/Room Types", href: "/area_room_types", icon: Home },
  { name: "Quotation Templates", href: "/quotation_templates", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar({ isOpen, onClose, onSignOut }: SidebarProps) {
  const pathname = usePathname()
  const handleSignOut = onSignOut ? onSignOut : () => { window.location.href = "/login" }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}  
      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-300",
          "backdrop-blur-md",
          "transform transition-transform duration-200 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ backgroundColor: "rgba(255, 255, 255, 1)" }}
      >
        <div className="h-full flex flex-col">

          {/* --- Fixed header block --- */}
          <div className="h-16 shrink-0 flex items-center justify-center border-b border-gray-200 bg-white px-4">
            <img
              src="/avLogo.png"
              alt="Company Logo"
              className="h-12 w-auto object-contain mx-auto"
              style={{ padding: "2px" }}
            />
          </div>

          {/* Close button for mobile (below header, also fixed height) */}
          <div className="flex items-center justify-between p-4 lg:hidden shrink-0 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-white/10 text-black"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable nav area (takes the remaining space only) */}
          <nav
            className="flex-1 px-3 py-2 overflow-y-auto overscroll-contain no-scrollbar"
            style={{ scrollbarGutter: "stable" }}
          >
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-[oklch(44.226%_0.00005_271.152)] ",
                      pathname === item.href
                        ? "bg-[oklch(56.179%_0.09578_195.735)] text-white shadow-md border-r-4 border-[oklch(56.179%_0.09578_195.735)] z-10"
                        : "hover:bg-[oklch(56.179%_0.09578_195.735)]/80 hover:text-white"
                    )}
                    style={
                      pathname === item.href
                        ? { boxShadow: "0 2px 8px 0 rgba(10, 150, 28, 0.77)" }
                        : {}
                    }
                    onClick={onClose}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5 flex-shrink-0",
                        pathname === item.href ? "text-white" : ""
                      )}
                    />
                    <span className="truncate">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="h-6 lg:h-3" />
          </nav>

          {/* --- Fixed footer block --- */}
          <div className="h-16 shrink-0 flex items-center justify-between border-t border-gray-200 bg-white px-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-black border-gray-300 hover:bg-red-50 hover:text-red-600"
              onClick={handleSignOut}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

