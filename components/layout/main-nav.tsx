"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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

  const handleClick = () => {
    // Close mobile menu when navigation happens
    if (onNavigate) {
      onNavigate()
    }
  }

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
            onClick={handleClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}