"use client"

import { useRouter } from "next/navigation"
import { LoginPage } from "@/components/login-page"

export default function Login() {
    const router = useRouter()

    const handleLogin = async (username: string, password: string) => {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // <-- important!
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (data.ok) {
            router.push("/dashboard");
        } else {
            alert("Invalid credentials");
            // Do not navigate, stay on login page
        }
    }

    return <LoginPage onLogin={handleLogin} />
}