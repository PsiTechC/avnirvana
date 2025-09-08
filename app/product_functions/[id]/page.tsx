"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FunctionDetailPage() {
  const { id } = useParams<{ id: string }>() ?? {};
  const router = useRouter();
  const [fn, setFn] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/product-functions/${id}`);
        if (!res.ok) throw new Error("Failed to load function");
        const { data } = await res.json();
        setFn(data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-muted-foreground">Loading…</div>
      </DashboardLayout>
    );
  }

  if (error || !fn) {
    return (
      <DashboardLayout>
        <div className="p-6 text-red-500">{error || "Function not found"}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-8">
        <div className="flex items-center justify-end gap-2 mb-4">
          <Button variant="outline" onClick={() => router.push("/product_functions")}>Back</Button>
          <Button variant="default" onClick={() => router.push(`/product_functions/${fn._id || fn.id}/edit`)}>Edit</Button>
          <Button variant="destructive" onClick={async () => {
            if (!window.confirm("Are you sure you want to delete this function?")) return;
            try {
              const res = await fetch(`/api/product-functions/${fn._id || fn.id}`, { method: "DELETE" });
              if (!res.ok) throw new Error("Delete failed");
              router.replace("/product_functions");
            } catch (e) {
              alert("Failed to delete function.");
            }
          }}>Delete</Button>
        </div>
        <div className="mt-4">
          <h2 className="text-3xl font-bold mb-4">{fn.name}</h2>
          <div className="mb-6">
            <span className="  text-[oklch(0%_0_0) font-semibold">Description:</span>
            <div className="mt-1 p-3 rounded bg-muted/10 max-h-64 min-h-[18rem] overflow-y-auto whitespace-pre-wrap border-2 border-muted">
              {fn.description || "—"}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Created: {fn.createdAt ? new Date(fn.createdAt).toLocaleString() : "-"}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
