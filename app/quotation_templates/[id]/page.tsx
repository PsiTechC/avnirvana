"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function QuotationTemplateDetailPage() {
    const router = useRouter()
    const params = useParams()
    const id = params?.id as string
    const [template, setTemplate] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchTemplate() {
            setLoading(true)
            try {
                const res = await fetch(`/api/quotation-templates/${id}`)
                if (!res.ok) throw new Error("Failed to fetch template")
                const { data } = await res.json()
                setTemplate(data)
            } catch (err: any) {
                setError(err?.message ?? "Error loading template")
            } finally {
                setLoading(false)
            }
        }
        if (id) fetchTemplate()
    }, [id])

    const handleDelete = async () => {
        if (!id) return
        if (!confirm("Are you sure you want to delete this template?")) return
        try {
            const res = await fetch(`/api/quotation-templates/${id}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Failed to delete template")
            router.push("/quotation_templates")
        } catch (err: any) {
            alert(err?.message ?? "Delete failed")
        }
    }

    if (loading) return <DashboardLayout><div className="p-8">Loading...</div></DashboardLayout>
    if (error) return <DashboardLayout><div className="p-8 text-red-500">{error}</div></DashboardLayout>
    if (!template) return <DashboardLayout><div className="p-8">Template not found</div></DashboardLayout>

    // Support both nested and flat image fields
    const backgroundImage = template.cover?.backgroundImage || template.backgroundImage || template.cover?.bgImageUrl
    const closingNoteImage = template.closingNote?.closingNoteImage || template.closingNoteImage
    const aboutUsImage = template.aboutUs?.aboutUsImage || template.aboutUsImage

    return (
        <DashboardLayout>
            <div className="p-8 max-w-3xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">{template.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <strong>About Us:</strong>
                            <div className="bg-muted p-2 rounded text-sm whitespace-pre-line max-h-32 overflow-auto">{template.aboutUs?.html ?? template.aboutUs?.markdown ?? ""}</div>
                        </div>
                        <div>
                            <strong>Proposal Note:</strong>
                            <div className="bg-muted p-2 rounded text-sm whitespace-pre-line max-h-32 overflow-auto">{template.proposalNote?.html ?? template.proposalNote?.markdown ?? ""}</div>
                        </div>
                        <div>
                            <strong>Closing Note:</strong>
                            <div className="bg-muted p-2 rounded text-sm whitespace-pre-line max-h-32 overflow-auto">{template.closingNote?.html ?? template.closingNote?.markdown ?? ""}</div>
                        </div>
                        {backgroundImage && (
                            <div>
                                <strong>Background Image:</strong>
                                <img src={backgroundImage} alt="Background" className="w-full h-32 object-cover mt-2 rounded" />
                            </div>
                        )}
                        {closingNoteImage && (
                            <div>
                                <strong>Closing Note Image:</strong>
                                <img src={closingNoteImage} alt="Closing Note" className="w-full h-32 object-cover mt-2 rounded" />
                            </div>
                        )}
                        {aboutUsImage && (
                            <div>
                                <strong>About Us Image:</strong>
                                <img src={aboutUsImage} alt="About Us" className="w-full h-32 object-cover mt-2 rounded" />
                            </div>
                        )}
                    </CardContent>
                </Card>
                <div className="flex gap-4 justify-end">
                    {/* <Button variant="outline" onClick={() => router.push(`/quotation_templates/${id}/edit`)}>Edit</Button> */}
                    <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                </div>
            </div>
        </DashboardLayout>
    )
}
