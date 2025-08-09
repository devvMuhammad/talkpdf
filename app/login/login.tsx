"use client"

import Image from "next/image"
import Link from "next/link"
import { Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function Login() {
  return (
    <main className="relative min-h-[100svh] overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#0b1220] via-[#0f1b2d] to-[#0b1220]" />
      <div
        aria-hidden
        className="absolute -top-1/3 left-1/2 h-[650px] w-[650px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl"
      />

      <div className="mx-auto grid min-h-[100svh] w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-12 lg:grid-cols-2">
        {/* Left: Brand + Copy */}
        <section className="order-2 space-y-6 text-center lg:order-1 lg:text-left">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-blue-100 backdrop-blur">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />
            Faster onboarding
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-blue-50 sm:text-4xl lg:text-5xl">
            Welcome back to TalkPDF
          </h1>
          <p className="mx-auto max-w-xl text-blue-200/80 lg:mx-0">
            Sign in to continue your conversations. Secure authentication via Google or GitHub.
          </p>

          <div className="hidden items-center gap-4 lg:flex">
            <Image src="/placeholder-logo.svg" alt="Logo" width={44} height={44} className="opacity-90" />
            <div className="h-10 w-px bg-white/10" />
            <div className="text-sm text-blue-200/70">
              Your data stays private. We only use it to improve your chat experience.
            </div>
          </div>
        </section>

        {/* Right: Card */}
        <section className="order-1 lg:order-2">
          <Card className="mx-auto w-full max-w-md border-white/10 bg-[#0c1527]/80 shadow-2xl shadow-blue-950/30 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-50">Sign in</CardTitle>
              <CardDescription className="text-blue-200/70">
                Choose a provider to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-center gap-3 bg-white text-slate-900 hover:bg-white/90"
                onClick={() => {
                  /* Hook up your Google OAuth handler here */
                }}
              >
                <GoogleIcon className="h-4 w-4" />
                Continue with Google
              </Button>

              <Button
                className="w-full justify-center gap-3 bg-[#0e1a2f] text-blue-100 hover:bg-[#12213d] border border-white/10"
                onClick={() => {
                  /* Hook up your GitHub OAuth handler here */
                }}
              >
                <Github className="h-4 w-4" />
                Continue with GitHub
              </Button>

              <p className="pt-3 text-center text-xs text-blue-200/60">
                By continuing, you agree to our
                <Link href="#" className="px-1 text-blue-300 hover:underline">
                  Terms
                </Link>
                and
                <Link href="#" className="px-1 text-blue-300 hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path fill="#4285F4" d="M533.5 278.4c0-18.6-1.7-37.1-5.2-55.2H272v104.6h146.9c-6.3 34-25.6 63-54.6 82.4v68.3h88.5c51.8-47.7 80.7-118 80.7-200.1z" />
      <path fill="#34A853" d="M272 544.3c73.1 0 134.5-24.1 179.3-65.2l-88.5-68.3c-24.6 16.6-56.1 26-90.8 26-69.9 0-129.1-47.2-150.4-110.5H30.4v69.5C74.7 486.8 167.5 544.3 272 544.3z" />
      <path fill="#FBBC05" d="M121.6 326.3c-11.5-34.1-11.5-71.3 0-105.4V151.3H30.4c-39.7 79.5-39.7 173.5 0 253l91.2-78z" />
      <path fill="#EA4335" d="M272 107.7c37.7-.6 74.1 13.2 101.8 38.6l75.9-75.9C405.9 24.8 340.2-.1 272 0 167.5 0 74.7 57.5 30.4 151.3l91.2 69.6C142.9 154.1 202.1 107.7 272 107.7z" />
    </svg>
  )
}


