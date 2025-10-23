"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Play, Pause, RefreshCw, ArrowRight, ArrowLeft, ArrowLeftRight } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface SyncConfig {
  id: string
  name: string
  source: "hubspot" | "sheets"
  destination: "hubspot" | "sheets"
  entityType: string
  syncDirection: string
  isActive: boolean
  syncInterval: number | null
  lastSyncAt: string | null
  recordsCount: number
}

const mockConfigs: SyncConfig[] = [
  {
    id: "1",
    name: "Contacts Sync",
    source: "hubspot",
    destination: "sheets",
    entityType: "contacts",
    syncDirection: "HUBSPOT_TO_SHEETS",
    isActive: true,
    syncInterval: 30,
    lastSyncAt: new Date(Date.now() - 3600000).toISOString(),
    recordsCount: 1250
  },
  {
    id: "2",
    name: "Deals Pipeline",
    source: "sheets",
    destination: "hubspot",
    entityType: "deals",
    syncDirection: "SHEETS_TO_HUBSPOT",
    isActive: true,
    syncInterval: 60,
    lastSyncAt: new Date(Date.now() - 7200000).toISOString(),
    recordsCount: 450
  },
  {
    id: "3",
    name: "Company Data Sync",
    source: "hubspot",
    destination: "sheets",
    entityType: "companies",
    syncDirection: "BIDIRECTIONAL",
    isActive: false,
    syncInterval: null,
    lastSyncAt: null,
    recordsCount: 0
  }
]

function SyncConfigCard({ config }: { config: SyncConfig }) {
  const getSyncDirectionIcon = () => {
    switch (config.syncDirection) {
      case "HUBSPOT_TO_SHEETS":
        return <ArrowRight className="h-4 w-4" />
      case "SHEETS_TO_HUBSPOT":
        return <ArrowLeft className="h-4 w-4" />
      default:
        return <ArrowLeftRight className="h-4 w-4" />
    }
  }

  const getSourceIcon = (type: string) => {
    return type === "hubspot" ? "🟠" : "📊"
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{config.name}</CardTitle>
            <CardDescription className="mt-1">
              {config.entityType.charAt(0).toUpperCase() + config.entityType.slice(1)}
            </CardDescription>
          </div>
          <Badge variant={config.isActive ? "default" : "secondary"}>
            {config.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getSourceIcon(config.source)}</span>
            <span className="text-sm font-medium">
              {config.source === "hubspot" ? "HubSpot" : "Sheets"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            {getSyncDirectionIcon()}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{getSourceIcon(config.destination)}</span>
            <span className="text-sm font-medium">
              {config.destination === "hubspot" ? "HubSpot" : "Sheets"}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sync Interval:</span>
            <span>{config.syncInterval ? `Every ${config.syncInterval} minutes` : "Manual"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Records:</span>
            <span>{config.recordsCount.toLocaleString()}</span>
          </div>
          {config.lastSyncAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Sync:</span>
              <span>{new Date(config.lastSyncAt).toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1">
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          {config.isActive ? (
            <Button size="sm" variant="outline" className="flex-1">
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="flex-1">
              <Play className="h-4 w-4 mr-1" />
              Resume
            </Button>
          )}
          <Button size="sm" variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SyncConfigsPage() {
  const [configs] = useState(mockConfigs)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Sync Configurations</h2>
            <p className="text-muted-foreground">
              Manage your data synchronization rules and schedules
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Configuration
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Create Sync Configuration</DialogTitle>
                <DialogDescription>
                  Set up a new data synchronization between HubSpot and Google Sheets
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Daily Contact Sync"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="entity" className="text-right">
                    Entity Type
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contacts">Contacts</SelectItem>
                      <SelectItem value="companies">Companies</SelectItem>
                      <SelectItem value="deals">Deals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="direction" className="text-right">
                    Sync Direction
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select sync direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hubspot-to-sheets">HubSpot → Sheets</SelectItem>
                      <SelectItem value="sheets-to-hubspot">Sheets → HubSpot</SelectItem>
                      <SelectItem value="bidirectional">Bidirectional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="interval" className="text-right">
                    Sync Interval
                  </Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select sync interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Only</SelectItem>
                      <SelectItem value="15">Every 15 minutes</SelectItem>
                      <SelectItem value="30">Every 30 minutes</SelectItem>
                      <SelectItem value="60">Every hour</SelectItem>
                      <SelectItem value="360">Every 6 hours</SelectItem>
                      <SelectItem value="1440">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="auto-start" className="text-right">
                    Auto-start
                  </Label>
                  <div className="col-span-3">
                    <Switch id="auto-start" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsCreateOpen(false)}>
                  Create Configuration
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Configs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{configs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Syncs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {configs.filter(c => c.isActive).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {configs.reduce((sum, c) => sum + c.recordsCount, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sync Frequency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">~30 min</div>
            </CardContent>
          </Card>
        </div>

        {/* Configurations Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {configs.map((config) => (
            <SyncConfigCard key={config.id} config={config} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}