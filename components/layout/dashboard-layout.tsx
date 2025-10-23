"use client"

import { useState } from "react"
import { MainNav } from "./main-nav"
import { UserNav } from "./user-nav"
import { ModeToggle } from "./mode-toggle"
import { Activity, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Sidebar content component to reuse in both desktop and mobile
  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">HubSync</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 space-y-4 py-4">
        <div className="px-3 py-2">
          <MainNav onNavigate={() => setMobileMenuOpen(false)} />
        </div>
      </div>

      {/* Bottom section */}
      <div className="border-t p-4">
        <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <span className="text-xs text-muted-foreground">
            All systems operational
          </span>
        </div>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r bg-background lg:block">
        <div className="flex h-full flex-col">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>

              {/* Mobile logo */}
              <div className="flex items-center gap-2 lg:hidden">
                <Activity className="h-5 w-5 text-primary" />
                <span className="text-base font-semibold">HubSync</span>
              </div>

              {/* Desktop title */}
              <h1 className="hidden text-lg font-semibold lg:block">
                HubSpot Bi-Directional Sync Platform
              </h1>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
              <ModeToggle />
              <UserNav />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}