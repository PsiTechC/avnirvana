"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AddFunctionPage() {
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setSubmitError("Name must be at least 2 characters.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/product-functions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const maybe = await res.json().catch(() => null);
        throw new Error(maybe?.error || "Create failed");
      }
      // Only navigate after successful creation
      router.replace("/product_functions");
    } catch (err: any) {
      setSubmitError(err?.message ?? "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto p-6">
        <Card className="border border-blue-200 shadow-sm bg-white/80">
          <CardHeader>
            <CardTitle className="text-2xl text-[oklch(0%_0_0)] font-bold mb-2">Add Function</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-[oklch(0%_0_0)] font-semibold mb-1">Function Name</label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter function name"
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-[oklch(0%_0_0)] font-semibold mb-1">Description</label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description of the function"
                  rows={6}
                  style={{ minHeight: '12rem', maxHeight: '12rem', overflowY: 'auto', resize: 'vertical' }}
                  className="scrollbar-thin border-black/30 scrollbar-thumb-blue-400 scrollbar-track-blue-100"
                />
              </div>
              {submitError && <p className="text-sm text-red-500">{submitError}</p>}
              <div className="flex gap-2">
                <Button type="button" className="bg-white text-[oklch(0%_0_0)] hover:bg-[oklch(0.577_0.245_27.325)]/80" onClick={() => router.push("/product_functions")}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
