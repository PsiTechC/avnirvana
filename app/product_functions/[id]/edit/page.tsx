"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function EditFunctionPage() {
  const { id } = useParams<{ id: string }>() ?? {};
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/product-functions/${id}`);
        if (!res.ok) throw new Error("Failed to load function");
        const { data } = await res.json();
        setFormData({
          name: data.name ?? "",
          description: data.description ?? "",
        });
      } catch (e: any) {
        setError(e?.message ?? "Failed to load");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/product-functions/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
          }),
        }
      );
      if (!res.ok) {
        const maybe = await res.json().catch(() => null);
        throw new Error(maybe?.error || "Update failed");
      }
      router.push("/product_functions");
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-muted-foreground">Loading…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto p-6">
        <Card className="border border-blue-200 shadow-sm bg-white/80">
          <CardHeader>
            <CardTitle className="text-2xl text-[oklch(35.04%_0.01007_216.95)] font-bold mb-2">Edit Function</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-[oklch(44.226%_0.00005_271.152)] font-semibold mb-1">Function Name</label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter function name"
                  className="border-black/30"
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-[oklch(44.226%_0.00005_271.152)] font-semibold mb-1">Description</label>
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
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-2">
                <Button type="button" variant="default" className="bg-white text-[oklch(0%_0_0)] hover:bg-[oklch(0.577_0.245_27.325)]/80" onClick={() => router.push("/product_functions")}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
