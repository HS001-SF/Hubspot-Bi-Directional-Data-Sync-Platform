"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import {
  Activity,
  Settings,
  RefreshCw,
  GitBranch,
  AlertCircle,
  BarChart3,
  Home,
  Plug2
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    name: "Sync Configs",
    href: "/sync-configs",
    icon: RefreshCw,
  },
  {
    name: "Field Mappings",
    href: "/field-mappings",
    icon: GitBranch,
  },
  {
    name: "Jobs",
    href: "/jobs",
    icon: Activity,
  },
  {
    name: "Conflicts",
    href: "/conflicts",
    icon: AlertCircle,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Connections",
    href: "/connections",
    icon: Plug2,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

interface MainNavProps {
  onNavigate?: () => void
}

export function MainNav({ onNavigate }: MainNavProps = {}) {
  const pathname = usePathname()
  const [expandedWidth, setExpandedWidth] = useState(0)
  const navRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({})

  // Method to calculate and set expanded width when nav item is selected
  const handleNavItemClick = (itemName: string) => {
    // Close mobile menu when navigation happens
    if (onNavigate) {
      onNavigate()
    }

    // Calculate the width extension needed to merge with panel
    const navElement = navRefs.current[itemName]
    if (navElement) {
      const currentWidth = navElement.offsetWidth
      const extensionAmount = 12 // 12px additional width to merge with panel
      setExpandedWidth(currentWidth + extensionAmount)
    }
  }

  // Update expanded width when pathname changes
  useEffect(() => {
    const activeItem = navigation.find(item =>
      pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
    )
    if (activeItem) {
      handleNavItemClick(activeItem.name)
    }
  }, [pathname])

  return (
    <nav className="flex flex-col space-y-1">
      {navigation.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href ||
                        (item.href !== "/" && pathname.startsWith(item.href))

        return (
          <Link
            key={item.name}
            href={item.href}
            ref={(el) => {
              navRefs.current[item.name] = el
            }}
            onClick={() => handleNavItemClick(item.name)}
            className={cn(
              "group relative flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all duration-300 ease-in-out",
              isActive
                ? "bg-card text-foreground shadow-sm rounded-lg z-[5]"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground hover:shadow-sm rounded-lg"
            )}
            style={isActive ? {
              width: expandedWidth > 0 ? `${expandedWidth}px` : 'auto',
              transition: 'width 300ms ease-in-out'
            } : undefined}
          >
            <Icon
              className={cn(
                "h-4 w-4 transition-all duration-300 ease-out",
                isActive
                  ? "text-primary scale-110 rotate-0"
                  : "group-hover:scale-110 group-hover:rotate-3 group-hover:text-primary"
              )}
            />
            <span className={cn(
              "transition-all duration-300",
              isActive && "font-semibold"
            )}>
              {item.name}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}