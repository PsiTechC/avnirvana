"use client"

import React, { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail } from "lucide-react"

export function EmailSettings() {
  const [mailHost, setMailHost] = useState("")
  const [mailPort, setMailPort] = useState("")
  const [sendFromId, setSendFromId] = useState("")
  const [sendFromPassword, setSendFromPassword] = useState("")

  // Load settings on mount
  React.useEffect(() => {
    fetch("/api/email-settings")
      .then(res => res.json())
      .then(data => {
        if (data) {
          setMailHost(data.mailHost || "")
          setMailPort(data.mailPort || "")
          setSendFromId(data.sendFromId || "")
          setSendFromPassword(data.sendFromPassword || "")
        }
      })
      .catch(() => {})
  }, [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch("/api/email-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mailHost, mailPort, sendFromId, sendFromPassword })
      })
      if (!res.ok) throw new Error("Failed to save settings")
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Error saving settings")
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif flex items-center">
          <Mail className="mr-2 h-5 w-5" />
          Email Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mailHost">Mail Host *</Label>
          <Input id="mailHost" value={mailHost} onChange={e => setMailHost(e.target.value)} placeholder="mail.example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mailPort">Mail Port *</Label>
          <Input id="mailPort" value={mailPort} onChange={e => setMailPort(e.target.value)} placeholder="587" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sendFromId">Send From ID *</Label>
          <Input id="sendFromId" value={sendFromId} onChange={e => setSendFromId(e.target.value)} placeholder="your@email.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sendFromPassword">Send From Password *</Label>
          <Input id="sendFromPassword" type="password" value={sendFromPassword} onChange={e => setSendFromPassword(e.target.value)} placeholder="••••••••" />
        </div>
        {error && <div className="text-sm text-red-500">{error}</div>}
        {success && <div className="text-sm text-green-600">Email settings saved!</div>}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-[oklch(32.988%_0.05618_196.615)] text-white hover:bg-[oklch(32.988%_0.05618_196.615)]/90" disabled={loading}>
            {loading ? "Saving..." : "Save Email Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}