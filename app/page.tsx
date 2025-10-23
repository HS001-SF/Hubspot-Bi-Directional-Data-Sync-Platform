"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StatsCard } from "@/components/dashboard/stats-card"
import { SyncStatus } from "@/components/dashboard/sync-status"
import { Activity, Database, RefreshCw, AlertTriangle, Users, Zap, Package, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Mock data - In production, this would come from your API
const stats = {
  totalSyncs: 1247,
  activeConfigs: 8,
  recordsSynced: 45823,
  conflicts: 3,
  successRate: 98.7,
  avgSyncTime: 2.4
}

const syncConfigs = [
  {
    id: "1",
    name: "HubSpot Contacts to Google Sheets",
    entityType: "Contacts",
    syncDirection: "HUBSPOT_TO_SHEETS",
    isActive: true,
    lastSyncAt: new Date().toISOString()
  },
  {
    id: "2",
    name: "Sales Pipeline Sync",
    entityType: "Deals",
    syncDirection: "SHEETS_BIDIRECTIONAL",
    isActive: true,
    lastSyncAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "3",
    name: "Company Data Import",
    entityType: "Companies",
    syncDirection: "SHEETS_TO_HUBSPOT",
    isActive: false,
    lastSyncAt: new Date(Date.now() - 86400000).toISOString()
  }
]

const currentJobs: Record<string, {
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED" | "PENDING"
  progress: number
  recordsProcessed: number
  recordsTotal: number
}> = {
  "1": {
    status: "IN_PROGRESS" as const,
    progress: 65,
    recordsProcessed: 650,
    recordsTotal: 1000
  },
  "2": {
    status: "COMPLETED" as const,
    progress: 100,
    recordsProcessed: 500,
    recordsTotal: 500
  }
}

const recentActivity = [
  { time: "2 minutes ago", action: "Sync completed", entity: "Contacts", status: "success" },
  { time: "15 minutes ago", action: "Conflict detected", entity: "Deals", status: "warning" },
  { time: "1 hour ago", action: "Sync started", entity: "Companies", status: "info" },
  { time: "3 hours ago", action: "Configuration updated", entity: "Settings", status: "info" },
  { time: "5 hours ago", action: "Sync failed", entity: "Contacts", status: "error" }
]

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor your HubSpot and Google Sheets synchronization
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Syncs"
            value={stats.totalSyncs.toLocaleString()}
            description="All time"
            icon={Activity}
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatsCard
            title="Active Configs"
            value={stats.activeConfigs}
            description="Currently running"
            icon={RefreshCw}
          />
          <StatsCard
            title="Records Synced"
            value={stats.recordsSynced.toLocaleString()}
            description="Last 24 hours"
            icon={Database}
            trend={{ value: 8.2, isPositive: true }}
          />
          <StatsCard
            title="Conflicts"
            value={stats.conflicts}
            description="Needs resolution"
            icon={AlertTriangle}
          />
        </div>

        {/* Additional Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Success Rate"
            value={`${stats.successRate}%`}
            description="Last 7 days"
            icon={Zap}
          />
          <StatsCard
            title="Avg Sync Time"
            value={`${stats.avgSyncTime}s`}
            description="Per 1000 records"
            icon={Clock}
          />
          <StatsCard
            title="Connected Accounts"
            value="2"
            description="HubSpot & Google"
            icon={Users}
          />
          <StatsCard
            title="Data Volume"
            value="1.2GB"
            description="Total processed"
            icon={Package}
          />
        </div>

        {/* Active Sync Configurations */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Active Sync Configurations</h3>
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {syncConfigs.map((config) => (
              <SyncStatus
                key={config.id}
                config={config}
                currentJob={currentJobs[config.id]}
              />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest sync operations and system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-500' :
                      activity.status === 'warning' ? 'bg-yellow-500' :
                      activity.status === 'error' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.entity}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}