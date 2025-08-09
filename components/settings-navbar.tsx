"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function SettingsNavbar() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-5xl flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">
              TP
            </span>
          </div>
          <span className="font-bold text-xl">TalkPDF</span>
        </Link>

        {/* Chat Link */}
        <Link
          href="/chat"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Chat
        </Link>

        {/* Profile */}
        <SignedIn>
          <UserButton afterSignOutUrl="/login" />
        </SignedIn>
        <SignedOut>
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
        </SignedOut>
      </div>
    </nav>
  );
}
