"use client"

import { Menu, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatars/01.png" alt="@user" />
                <AvatarFallback className="bg-gray-800 text-gray-100">
                  <User size={16} />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-gray-900 border-gray-700" align="end" forceMount>
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium text-gray-100">John Doe</p>
                <p className="w-[200px] truncate text-sm text-gray-400">john.doe@example.com</p>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem className="text-gray-100 hover:bg-gray-800">Profile Settings</DropdownMenuItem>
            <DropdownMenuItem className="text-gray-100 hover:bg-gray-800">Billing</DropdownMenuItem>
            <DropdownMenuItem className="text-gray-100 hover:bg-gray-800">Preferences</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem className="text-gray-100 hover:bg-gray-800">Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
