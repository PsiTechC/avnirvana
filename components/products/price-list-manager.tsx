// "use client"

// import type React from "react"

// import { useState } from "react"
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Upload, Download, FileText, Trash2 } from "lucide-react"

// interface PriceListManagerProps {
//   open: boolean
//   onOpenChange: (open: boolean) => void
// }

// const mockPriceLists = [
//   {
//     id: "1",
//     name: "Q1 2024 Price List",
//     filename: "q1-2024-prices.xlsx",
//     uploadDate: "2024-01-15",
//     size: "2.4 MB",
//     products: 247,
//   },
//   {
//     id: "2",
//     name: "Holiday Special Pricing",
//     filename: "holiday-special-2023.xlsx",
//     uploadDate: "2023-12-01",
//     size: "1.8 MB",
//     products: 156,
//   },
//   {
//     id: "3",
//     name: "Bulk Dealer Pricing",
//     filename: "bulk-dealer-prices.xlsx",
//     uploadDate: "2023-11-20",
//     size: "3.1 MB",
//     products: 312,
//   },
// ]

// export function PriceListManager({ open, onOpenChange }: PriceListManagerProps) {
//   const [priceLists, setPriceLists] = useState(mockPriceLists)
//   const [selectedFile, setSelectedFile] = useState<File | null>(null)

//   const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0]
//     if (file) {
//       setSelectedFile(file)
//     }
//   }

//   const handleUpload = () => {
//     if (selectedFile) {
//       // Here you would typically upload the file to your backend
//       console.log("Uploading price list:", selectedFile.name)
//       const newPriceList = {
//         id: Date.now().toString(),
//         name: selectedFile.name.replace(/\.[^/.]+$/, ""),
//         filename: selectedFile.name,
//         uploadDate: new Date().toISOString().split("T")[0],
//         size: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`,
//         products: Math.floor(Math.random() * 300) + 50,
//       }
//       setPriceLists([newPriceList, ...priceLists])
//       setSelectedFile(null)
//     }
//   }

//   const handleDownload = (priceList: (typeof mockPriceLists)[0]) => {
//     // Here you would typically download the file from your backend
//     console.log("Downloading price list:", priceList.filename)
//   }

//   const handleDelete = (id: string) => {
//     setPriceLists(priceLists.filter((list) => list.id !== id))
//   }

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="font-serif">Price List Management</DialogTitle>
//         </DialogHeader>

//         <div className="space-y-6">
//           {/* Upload Section */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-lg font-serif">Upload New Price List</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="space-y-2">
//                 <Label htmlFor="price-list-file">Select Excel File</Label>
//                 <Input
//                   id="price-list-file"
//                   type="file"
//                   accept=".xlsx,.xls,.csv"
//                   onChange={handleFileUpload}
//                   className="cursor-pointer"
//                 />
//               </div>
//               {selectedFile && (
//                 <div className="flex items-center justify-between p-3 bg-muted rounded-md">
//                   <div className="flex items-center space-x-2">
//                     <FileText className="h-4 w-4" />
//                     <span className="text-sm">{selectedFile.name}</span>
//                     <span className="text-xs text-muted-foreground">
//                       ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
//                     </span>
//                   </div>
//                   <Button onClick={handleUpload} size="sm" className="bg-accent hover:bg-accent/90">
//                     <Upload className="mr-2 h-4 w-4" />
//                     Upload
//                   </Button>
//                 </div>
//               )}
//             </CardContent>
//           </Card>

//           {/* Existing Price Lists */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-lg font-serif">Existing Price Lists</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-3">
//                 {priceLists.map((priceList) => (
//                   <div key={priceList.id} className="flex items-center justify-between p-3 border rounded-md">
//                     <div className="flex items-center space-x-3">
//                       <FileText className="h-5 w-5 text-muted-foreground" />
//                       <div>
//                         <h4 className="font-medium">{priceList.name}</h4>
//                         <p className="text-sm text-muted-foreground">
//                           {priceList.products} products • {priceList.size} • Uploaded {priceList.uploadDate}
//                         </p>
//                       </div>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <Button variant="outline" size="sm" onClick={() => handleDownload(priceList)}>
//                         <Download className="mr-2 h-4 w-4" />
//                         Download
//                       </Button>
//                       <Button variant="outline" size="sm" onClick={() => handleDelete(priceList.id)}>
//                         <Trash2 className="h-4 w-4" />
//                       </Button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         <div className="flex justify-end pt-4">
//           <Button variant="outline" onClick={() => onOpenChange(false)}>
//             Close
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   )
// }
