"use client"

import { Menu } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import Link from "next/link"

interface AppHeaderProps {
  chatTitle?: string
  isChatActive: boolean
}

export function AppHeader({ chatTitle, isChatActive }: AppHeaderProps) {
  if (!isChatActive) return null

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-800 px-4 bg-gray-900 animate-fade-in">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg">
          <Menu size={16} />
        </SidebarTrigger>
        <Separator orientation="vertical" className="mr-2 h-4 bg-gray-700" />
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-gray-100">{chatTitle || "Chat with Assistant"}</h1>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <SignedIn>
          <UserButton afterSignOutUrl="/login" />
        </SignedIn>
        <SignedOut>
          <Link href="/login" className="text-sm text-gray-300 hover:text-white">
            Sign in
          </Link>
        </SignedOut>
      </div>
    </header>
  )
}
