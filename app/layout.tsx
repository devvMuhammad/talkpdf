import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/components/theme-provider"
import { Inter } from "next/font/google"
import type { ReactNode } from "react"
import { ClerkProvider } from "@clerk/nextjs"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "OpenAI and AI SDK Chatbot",
  description: "A comprehensive AI chatbot with dark theme and sidebar management.",
  generator: 'v0.dev'
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider signInUrl="/login" signUpUrl="/login" afterSignOutUrl="/login">
      <html lang="en">
        <body className={cn("flex min-h-svh flex-col antialiased bg-gray-950 text-gray-100", inter.className)}>
          <ConvexClientProvider>
            <ThemeProvider defaultTheme="dark" storageKey="chatbot-theme">
              <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
            </ThemeProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>

  )
}


import './globals.css'
import { ConvexClientProvider } from "./context/convex-provider"
