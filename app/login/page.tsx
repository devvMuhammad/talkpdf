"use client"
import { SignIn } from "@clerk/clerk-react"

export default function LoginPage() {
  return <main className="relative min-h-[100svh] overflow-hidden">
    {/* Background */}
    <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#0b1220] via-[#0f1b2d] to-[#0b1220]" />
    <div className="mx-auto min-h-[100svh] w-full max-w-6xl flex items-center justify-center">
      <SignIn forceRedirectUrl="/chat" />
    </div>
  </main>
}