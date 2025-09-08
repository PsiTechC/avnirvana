
"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
type BrandStatus = "active" | "inactive"

export default function AddBrandPage() {
	const router = useRouter()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [logoError, setLogoError] = useState<string | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const [formData, setFormData] = useState({
		name: "",
		description: "",
		websiteUrl: "",
		status: "active" as BrandStatus,
		logo: null as File | null,
		logoPreview: "",
	})

	const resetForm = () =>
		setFormData({
			name: "",
			description: "",
			websiteUrl: "",
			status: "active",
			logo: null,
			logoPreview: "",
		})

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		setLogoError(null)
		if (!file) return
		const validTypes = ["image/png", "image/jpeg"]
		if (!validTypes.includes(file.type)) {
			setLogoError("Please upload a PNG or JPG image.")
			if (fileInputRef.current) fileInputRef.current.value = ""
			return
		}
		const MAX_BYTES = 2 * 1024 * 1024
		if (file.size > MAX_BYTES) {
			setLogoError("File is too large. Max size is 2MB.")
			if (fileInputRef.current) fileInputRef.current.value = ""
			return
		}
		const reader = new FileReader()
		reader.onloadend = () => {
			setFormData((prev) => ({
				...prev,
				logo: file,
				logoPreview: reader.result as string,
			}))
		}
		reader.readAsDataURL(file)
	}

	const removeLogo = () => {
		setLogoError(null)
		setFormData((prev) => ({ ...prev, logo: null, logoPreview: "" }))
		if (fileInputRef.current) fileInputRef.current.value = ""
	}

	const handleSubmit = async () => {
		if (isSubmitting) return
		setIsSubmitting(true)
		try {
			const fd = new FormData()
			fd.append("name", formData.name)
			fd.append("description", formData.description)
			fd.append("websiteUrl", formData.websiteUrl)
			fd.append("status", formData.status)
			if (formData.logo) fd.append("logo", formData.logo)
			const res = await fetch("/api/brands", { method: "POST", body: fd })
			if (!res.ok) throw new Error("Create failed")
			resetForm()
			setIsSubmitting(false)
			router.push("/brands")
		} catch {
			setIsSubmitting(false)
		}
	}

	return (
		<DashboardLayout>
			<div className="p-6">
				<Card className="max-w-4xl mx-auto p-6 shadow-lg border border-gray-200  bg-[oklch(98%_0.01_220)]/80 backdrop-blur-md">
					<CardHeader>
						<CardTitle className="text-3xl font-bold text-[oklch(35.04%_0.01007_216.95)]">Add New Brand</CardTitle>
						<CardDescription className="text-sm font-bold text-[oklch(44.226%_0.00005_271.152)]">Fill in the details below</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-6 md:grid-cols-3">
							{/* Left: details */}
							<div className="md:col-span-2 space-y-4">
								<div className="grid gap-1">
									<Label className="text-xs text-[oklch(0%_0_0)]">Brand Name</Label>
									<Input
										name="name"
										value={formData.name}
										onChange={e => setFormData({ ...formData, name: e.target.value })}
										placeholder="Enter brand name"
										required
										maxLength={120}
										className="bg-white/20 border-black/30 text-black placeholder-white/60 backdrop-blur-sm rounded-lg text-sm py-1.5 px-2"
									/>
								</div>
								<div className="grid gap-1">
									<Label className="text-xs text-[oklch(0%_0_0)]">Website</Label>
									<Input
										name="websiteUrl"
										type="url"
										inputMode="url"
										value={formData.websiteUrl}
										onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
										placeholder="https://example.com"
										required
										maxLength={2048}
										className="bg-white/20 border-black/30 text-black placeholder-white/60 backdrop-blur-sm rounded-lg text-sm py-1.5 px-2"
									/>
								</div>
								<div className="grid gap-1">
									<Label className="text-xs text-[oklch(0%_0_0)]">Description</Label>
									<Textarea
										name="description"
										value={formData.description}
										onChange={e => setFormData({ ...formData, description: e.target.value })}
										placeholder="Enter brand description"
										rows={3}
										required
										maxLength={500}
										className="h-20 max-h-24 overflow-y-auto resize-none bg-white/20 border-black/30 text-black placeholder-white/60 backdrop-blur-sm rounded-lg scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100 text-sm py-1.5 px-2"
										style={{ minHeight: "5rem", maxHeight: "6rem", overflowY: "auto" }}
									/>
								</div>
								<div className="grid gap-1">
									<Label className="text-xs text-[oklch(0%_0_0)]">Status</Label>
									<Select value={formData.status} onValueChange={value => setFormData({ ...formData, status: value as BrandStatus })}>
										<SelectTrigger className="bg-white/20 border-black/30 text-[oklch(0%_0_0)] backdrop-blur-sm rounded-lg text-sm py-1.5 px-2">
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
										<SelectContent className="bg-white/90 backdrop-blur-md border-black/20 rounded-lg text-sm">
											<SelectItem value="active" className="text-gray-900 hover:bg-white/20 text-sm">Active</SelectItem>
											<SelectItem value="inactive" className="text-gray-900 hover:bg-white/20 text-sm">Inactive</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							{/* Right: logo / company image */}
							<aside className="md:col-span-1">
								<div className="rounded-lg border bg-muted/20 p-3">
									<div className="relative w-full aspect-[4/3] overflow-hidden rounded-md">
										{formData.logoPreview ? (
											<Image
												src={formData.logoPreview}
												alt="Brand logo preview"
												fill
												sizes="(max-width: 768px) 100vw, 33vw"
												className="object-contain"
											/>
										) : (
											<div
												role="button"
												tabIndex={0}
												aria-label="Upload brand logo"
												onClick={() => fileInputRef.current?.click()}
												onKeyDown={e => (e.key === "Enter" || e.key === " ") && fileInputRef.current?.click()}
												className="flex flex-col items-center justify-center w-full h-full min-h-[120px] border-2 border-dashed border-black/30 rounded-lg cursor-pointer hover:border-black/50 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
											>
												<Upload className="h-6 w-6 text-[oklch(0%_0_0)] mb-1" />
												<span className="text-xs text-[oklch(0%_0_0)]">Click to upload logo</span>
												<span className="text-[10px] text-[oklch(0%_0_0)]">PNG, JPG up to 2MB</span>
											</div>
										)}
										<Input ref={fileInputRef} type="file" accept="image/png,image/jpeg" onChange={handleFileSelect} className="hidden" />
										{formData.logoPreview && (
											<Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-5 w-5 rounded-full bg-red-500 hover:bg-red-600 text-white" onClick={removeLogo} aria-label="Remove logo"><X className="h-3 w-3" /></Button>
										)}
										{logoError && <p className="text-[10px] text-red-300 mt-2">{logoError}</p>}
									</div>
									<p className="mt-2 text-xs text-[oklch(0%_0_0)] text-center">Brand Logo</p>
								</div>
							</aside>
						</div>
						{/* Actions */}
						<div className="flex justify-end gap-2 pt-6">
							<Button type="button" onClick={() => router.push("/brands")} className="bg-white text-[oklch(0%_0_0)] hover:bg-[oklch(0.577_0.245_27.325)]/80 backdrop-blur-sm rounded-lg text-sm px-3 py-1">Cancel</Button>
							<Button type="button" disabled={isSubmitting} onClick={handleSubmit}
								className=" bg-[oklch(32.988%_0.05618_196.615)] text-white hover:bg-[oklch(32.988%_0.05618_196.615)]/90  backdrop-blur-sm rounded-lg disabled:opacity-60 text-sm px-3 py-1">{isSubmitting ? "Adding..." : "Add Brand"}</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	)
}
