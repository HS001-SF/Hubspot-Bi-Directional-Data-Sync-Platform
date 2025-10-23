"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { PlayCircle, PauseCircle, RefreshCw, AlertCircle } from "lucide-react"

interface SyncStatusProps {
  config: {
    id: string
    name: string
    entityType: string
    syncDirection: string
    isActive: boolean
    lastSyncAt?: string
  }
  currentJob?: {
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED"
    progress: number
    recordsProcessed: number
    recordsTotal: number
  }
}

export function SyncStatus({ config, currentJob }: SyncStatusProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return <Badge className="bg-blue-500">Syncing</Badge>
      case "COMPLETED":
        return <Badge className="bg-green-500">Completed</Badge>
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>
      default:
        return <Badge variant="outline">Idle</Badge>
    }
  }

  const getSyncDirectionLabel = (direction: string) => {
    switch (direction) {
      case "HUBSPOT_TO_SHEETS":
        return "HubSpot → Sheets"
      case "SHEETS_TO_HUBSPOT":
        return "Sheets → HubSpot"
      case "SHEETS_BIDIRECTIONAL":
        return "⇄ Bidirectional"
      default:
        return direction
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{config.name}</CardTitle>
            <CardDescription className="mt-1">
              {config.entityType} • {getSyncDirectionLabel(config.syncDirection)}
            </CardDescription>
          </div>
          {getStatusBadge(currentJob?.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentJob?.status === "IN_PROGRESS" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="text-muted-foreground">
                {currentJob.recordsProcessed} / {currentJob.recordsTotal} records
              </span>
            </div>
            <Progress value={currentJob.progress} className="h-2" />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm">
            {config.lastSyncAt ? (
              <span className="text-muted-foreground">
                Last sync: {mounted ? new Date(config.lastSyncAt).toLocaleString() : '...'}
              </span>
            ) : (
              <span className="text-muted-foreground">Never synced</span>
            )}
          </div>

          <div className="flex gap-2">
            {config.isActive ? (
              <Button size="sm" variant="outline">
                <PauseCircle className="h-4 w-4 mr-1" />
                Pause
              </Button>
            ) : (
              <Button size="sm" variant="outline">
                <PlayCircle className="h-4 w-4 mr-1" />
                Resume
              </Button>
            )}
            <Button size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Sync Now
            </Button>
          </div>
        </div>

        {currentJob?.status === "FAILED" && (
          <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-md">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">
              Sync failed. Check logs for details.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}