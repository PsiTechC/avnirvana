"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function AddQuotationTemplatePage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        name: "",
        backgroundImage: "",
        backgroundImageFile: undefined as File | undefined,
        aboutUs: "",
        aboutUsImage: "",
        aboutUsImageFile: undefined as File | undefined,
        proposalNote: "",
        closingNote: "",
        closingNoteImage: "",
        closingNoteImageFile: undefined as File | undefined,
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: "backgroundImage" | "closingNoteImage" | "aboutUsImage") => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    [field]: reader.result as string,
                    [field + "File"]: file,
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null)
        setIsSubmitting(true)
        try {
            const form = new FormData();
            form.append("name", formData.name);
            form.append("aboutUs", formData.aboutUs);
            if (formData.aboutUsImageFile) {
                form.append("aboutUsImage", formData.aboutUsImageFile);
            }
            form.append("proposalNote", formData.proposalNote);
            form.append("closingNote", formData.closingNote);
            if (formData.backgroundImageFile) {
                form.append("backgroundImage", formData.backgroundImageFile);
            }
            if (formData.closingNoteImageFile) {
                form.append("closingNoteImage", formData.closingNoteImageFile);
            }
            const res = await fetch("/api/quotation-templates", {
                method: "POST",
                body: form,
            });
            if (!res.ok) {
                const maybe = await res.json().catch(() => null)
                throw new Error(maybe?.error || "Failed to add template")
            }
            router.push("/quotation_templates")
        } catch (err: any) {
            setError(err?.message ?? "Something went wrong")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="flex justify-center items-center py-8 px-2">
                <Card className="w-full max-w-5xl mx-auto shadow-lg border border-blue-200 bg-white/90">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-[oklch(35.04%_0.01007_216.95)] ">Add Quotation Template</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left: Text fields */}
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Company Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Enter company name"
                                        className="border border-black"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="aboutUs">About Us</Label>
                                        <Textarea
                                            id="aboutUs"
                                            value={formData.aboutUs}
                                            onChange={e => setFormData({ ...formData, aboutUs: e.target.value })}
                                            placeholder="Write about your company"
                                            className="h-32 overflow-auto resize-none border border-black"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="proposalNote">Proposal Note</Label>
                                        <Textarea
                                            id="proposalNote"
                                            value={formData.proposalNote}
                                            onChange={e => setFormData({ ...formData, proposalNote: e.target.value })}
                                            placeholder="Your proposal note goes here..."
                                            className="h-32 overflow-auto resize-none border border-black"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="closingNote">Closing Note</Label>
                                    <Textarea
                                        id="closingNote"
                                        value={formData.closingNote}
                                        onChange={e => setFormData({ ...formData, closingNote: e.target.value })}
                                        placeholder="Thank you for your consideration."
                                        className="h-32 overflow-auto resize-none border border-black"
                                    />
                                </div>
                                {error && <div className="text-red-500 text-sm">{error}</div>}
                            </div>
                            {/* Right: Image uploads */}
                            <div className="space-y-6 flex flex-col h-full justify-between">
                                <div>
                                    <div className="grid gap-2 ">
                                        <Label htmlFor="backgroundImage">Background Image</Label>
                                        <Input
                                            id="backgroundImage"
                                            type="file"
                                            accept="image/*"
                                            onChange={e => handleImageUpload(e, "backgroundImage")}
                                        />
                                        {formData.backgroundImage && (
                                            <img src={formData.backgroundImage} alt="Background Preview" className="w-full h-24 object-cover mt-2 rounded" />
                                        )}
                                    </div>
                                    <div className="grid gap-2 mt-6">
                                        <Label htmlFor="aboutUsImage">About Us Image</Label>
                                        <Input
                                            id="aboutUsImage"
                                            type="file"
                                            accept="image/*"
                                            onChange={e => handleImageUpload(e, "aboutUsImage")}
                                        />
                                        {formData.aboutUsImage && (
                                            <img src={formData.aboutUsImage} alt="About Us Preview" className="w-full h-24 object-cover mt-2 rounded" />
                                        )}
                                    </div>
                                    <div className="grid gap-2 mt-6">
                                        <Label htmlFor="closingNoteImage">Closing Note Image</Label>
                                        <Input
                                            id="closingNoteImage"
                                            type="file"
                                            accept="image/*"
                                            onChange={e => handleImageUpload(e, "closingNoteImage")}
                                        />
                                        {formData.closingNoteImage && (
                                            <img src={formData.closingNoteImage} alt="Closing Note Preview" className="w-full h-24 object-cover mt-2 rounded" />
                                        )}
                                    </div>
                                </div>
                                <Button type="submit" disabled={isSubmitting} className="w-full mt-8">{isSubmitting ? "Saving..." : "Save Template"}</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
