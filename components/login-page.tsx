"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Building2 } from "lucide-react"



interface LoginPageProps {
  onLogin: (username: string, password: string) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate login delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    onLogin(username, password)
    setIsLoading(false)
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Left Column - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Header */}
          <div className="text-center">
            {/* <div className="mx-auto h-16 w-16 bg-primary rounded-xl flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div> */}
            <img
              src="/avLogo.png"
              alt="AV Nirvana Logo"
              className="mx-auto mb-2 h-12 w-auto"
            />
            {/* <h1 className="text-3xl font-bold font-serif text-primary">AV NIRVANA</h1> */}
            <p className="text-muted-foreground mt-2 text-center">Sign in to manage your business operations</p>
          </div>
            {/* <h1 className="text-3xl font-bold font-serif text-primary">AV NIRVANA</h1>
            <p className="text-muted-foreground mt-2">Sign in to manage your business operations</p>
          </div> */}

          {/* Login Card */}
          <Card className="border border-gray-300 shadow-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Sign In</CardTitle>
              <CardDescription className="text-center">Enter your credentials to access the dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                {/* <p>Demo credentials: admin / password</p> */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Column - Image Carousel
      <div className="flex-1 relative overflow-hidden">
        <ImageCarousel/>
      </div> */}
    </div>
  )
}
