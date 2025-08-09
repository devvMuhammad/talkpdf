import type React from "react";
import Link from "next/link";
import { SettingsNavbar } from "@/components/settings-navbar";

function SettingsSidebar() {
  return (
    <aside className="w-64 pr-8">
      <nav className="flex flex-col space-y-1">
        <Link
          href="/settings/profile"
          className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Profile
        </Link>
        <Link
          href="/settings/models"
          className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Models
        </Link>
      </nav>
    </aside>
  );
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <SettingsNavbar />
      <main className="container mx-auto max-w-5xl py-10">
        <div className="space-y-6">
          <div className="space-y-0.5">
            <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
            <p className="text-muted-foreground">
              Manage your account settings and preferences.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
            <SettingsSidebar />
            <div className="flex-1">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
