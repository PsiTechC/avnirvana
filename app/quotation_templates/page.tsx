"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, FileIcon as FileTemplate, Search } from "lucide-react"


interface RichTextField {
    html?: string;
    markdown?: string;
}

interface QuotationTemplate {
    _id: string;
    name: string;
    cover?: {
        backgroundImage?: string;
        bgImageUrl?: string;
    };
    aboutUs: string | RichTextField;
    proposalNote: string | RichTextField;
    closingNote: string | RichTextField & { closingNoteImage?: string };
    createdAt: string;
}

export default function QuotationTemplatesPage() {
    const [templates, setTemplates] = useState<QuotationTemplate[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        backgroundImage: "",
        backgroundImageFile: undefined as File | undefined,
        aboutUs: "",
        proposalNote: "",
        closingNote: "",
        closingNoteImage: "",
        closingNoteImageFile: undefined as File | undefined,
    })
    const [searchTerm, setSearchTerm] = useState("")
    const router = useRouter()

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: "backgroundImage" | "closingNoteImage") => {
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
        if (formData.name.trim()) {
            const form = new FormData();
            form.append("name", formData.name);
            form.append("aboutUs", formData.aboutUs);
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
            const { data: newTemplate } = await res.json();
            setTemplates([newTemplate, ...templates]);
            setFormData({
                name: "",
                backgroundImage: "",
                backgroundImageFile: undefined,
                aboutUs: "",
                proposalNote: "",
                closingNote: "",
                closingNoteImage: "",
                closingNoteImageFile: undefined,
            });
            setIsDialogOpen(false);
        }
    };
    useEffect(() => {
        async function fetchTemplates() {
            const res = await fetch("/api/quotation-templates");
            const { data } = await res.json();
            setTemplates(data);
        }
        fetchTemplates();
    }, []);

    const getText = (field: string | RichTextField) => {
        if (typeof field === "string") return field;
        if (field && typeof field === "object") return field.html || field.markdown || "";
        return "";
    };

    const filteredTemplates = templates
        .filter((template) => !!template._id)
        .filter(
            (template) =>
                template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                getText(template.aboutUs).toLowerCase().includes(searchTerm.toLowerCase()) ||
                getText(template.proposalNote).toLowerCase().includes(searchTerm.toLowerCase()) ||
                getText(template.closingNote).toLowerCase().includes(searchTerm.toLowerCase())
        );

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight  text-[oklch(35.04%_0.01007_216.95)]">Quotation Templates</h1>
                        <p className="text-[oklch(44.226%_0.00005_271.152)] font-semibold">Create and manage reusable quotation templates</p>
                    </div>
                    <Button
                        className="bg-[oklch(32.988%_0.05618_196.615)] text-white hover:bg-[oklch(32.988%_0.05618_196.615)]/90"
                        onClick={() => window.location.assign("/quotation_templates/add")}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Template
                    </Button>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search templates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
                            <FileTemplate className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{templates.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Recently Added</CardTitle>
                            <Plus className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {
                                    templates.filter((template) => {
                                        const weekAgo = new Date()
                                        weekAgo.setDate(weekAgo.getDate() - 7)
                                        return new Date(template.createdAt) > weekAgo
                                    }).length
                                }
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Search Results</CardTitle>
                            <Search className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{filteredTemplates.length}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Templates List */}
                {filteredTemplates.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredTemplates.map((template, idx) => (
                            <Card
                                key={template._id}
                                className="hover:shadow-md transition-shadow cursor-pointer max-h-80 min-h-[18rem] flex flex-col"
                                style={{overflow: 'hidden'}}
                                onClick={() => router.push(`/quotation_templates/${template._id}`)}
                            >
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-base truncate">
                                        <FileTemplate className="h-5 w-5 text-primary" />
                                        <span className="truncate max-w-[140px]">{template.name}</span>
                                    </CardTitle>
                                    <CardDescription className="text-xs">Created: {new Date(template.createdAt).toLocaleDateString()}</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0 flex-1 flex flex-col gap-1">
                                    <p className="text-xs text-muted-foreground truncate max-w-full" title={typeof template.aboutUs === "object" ? template.aboutUs.html || template.aboutUs.markdown || "" : template.aboutUs}>
                                        <span className="font-semibold">About Us:</span> {typeof template.aboutUs === "object" ? (template.aboutUs.html || template.aboutUs.markdown || "").slice(0, 60) : (template.aboutUs || "").slice(0, 60)}{getText(template.aboutUs).length > 60 ? "..." : ""}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate max-w-full" title={typeof template.proposalNote === "object" ? template.proposalNote.html || template.proposalNote.markdown || "" : template.proposalNote}>
                                        <span className="font-semibold">Proposal Note:</span> {typeof template.proposalNote === "object" ? (template.proposalNote.html || template.proposalNote.markdown || "").slice(0, 60) : (template.proposalNote || "").slice(0, 60)}{getText(template.proposalNote).length > 60 ? "..." : ""}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate max-w-full" title={typeof template.closingNote === "object" ? template.closingNote.html || template.closingNote.markdown || "" : template.closingNote}>
                                        <span className="font-semibold">Closing Note:</span> {typeof template.closingNote === "object" ? (template.closingNote.html || template.closingNote.markdown || "").slice(0, 60) : (template.closingNote || "").slice(0, 60)}{getText(template.closingNote).length > 60 ? "..." : ""}
                                    </p>
                                    {/* Images */}
                                    <div className="flex gap-2 mt-2">
                                        {template.cover?.backgroundImage && (
                                            <img src={template.cover.backgroundImage} alt="Background" className="w-16 h-16 object-cover rounded" />
                                        )}
                                        {template.cover?.bgImageUrl && !template.cover?.backgroundImage && (
                                            <img src={template.cover.bgImageUrl} alt="Background" className="w-16 h-16 object-cover rounded" />
                                        )}
                                        {typeof template.closingNote === "object" && template.closingNote.closingNoteImage && (
                                            <img src={template.closingNote.closingNoteImage} alt="Closing Note" className="w-16 h-16 object-cover rounded" />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <FileTemplate className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No quotation templates found</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                {searchTerm
                                    ? "No templates match your search criteria."
                                    : "Get started by creating your first quotation template."}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    )
}
