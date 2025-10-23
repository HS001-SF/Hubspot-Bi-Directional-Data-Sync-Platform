"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, ExternalLink, RefreshCw, Plug2, AlertCircle } from "lucide-react"
import Image from "next/image"

interface ConnectionCardProps {
  provider: "hubspot" | "google"
  isConnected: boolean
  accountInfo?: {
    email?: string
    portalId?: string
    accountId?: string
    lastSync?: string
  } | null
  onConnect: () => void
  onDisconnect: () => void
  onRefresh?: () => void
}

function ConnectionCard({
  provider,
  isConnected,
  accountInfo,
  onConnect,
  onDisconnect,
  onRefresh
}: ConnectionCardProps) {
  const providerInfo = {
    hubspot: {
      name: "HubSpot",
      description: "Connect your HubSpot CRM to sync contacts, companies, and deals",
      icon: "🟠",
      color: "bg-orange-500",
      scopes: ["crm.objects.contacts.read", "crm.objects.contacts.write", "crm.objects.companies.read", "crm.objects.companies.write", "crm.objects.deals.read", "crm.objects.deals.write"]
    },
    google: {
      name: "Google Sheets",
      description: "Connect Google Sheets to import and export data in real-time",
      icon: "📊",
      color: "bg-green-500",
      scopes: ["spreadsheets", "drive.readonly", "userinfo.email"]
    }
  }

  const info = providerInfo[provider]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${info.color} flex items-center justify-center text-white text-xl`}>
              {info.icon}
            </div>
            <div>
              <CardTitle>{info.name}</CardTitle>
              <CardDescription className="mt-1">{info.description}</CardDescription>
            </div>
          </div>
          <Badge variant={isConnected ? "default" : "outline"}>
            {isConnected ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Not Connected
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isConnected && accountInfo ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Account:</span>
              <span className="font-medium">{accountInfo.email || accountInfo.accountId}</span>
            </div>
            {accountInfo.portalId && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Portal ID:</span>
                <span className="font-medium">{accountInfo.portalId}</span>
              </div>
            )}
            {accountInfo.lastSync && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Sync:</span>
                <span className="font-medium">{new Date(accountInfo.lastSync).toLocaleString()}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No account connected. Click below to authorize access.
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Required Permissions:</p>
          <div className="flex flex-wrap gap-1">
            {info.scopes.slice(0, 3).map((scope) => (
              <Badge key={scope} variant="secondary" className="text-xs">
                {scope.split('.').pop()}
              </Badge>
            ))}
            {info.scopes.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{info.scopes.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        {isConnected ? (
          <>
            <Button variant="outline" size="sm" onClick={onDisconnect}>
              Disconnect
            </Button>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh Token
              </Button>
            )}
          </>
        ) : (
          <Button onClick={onConnect} className="w-full">
            <Plug2 className="h-4 w-4 mr-2" />
            Connect {info.name}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export default function ConnectionsPage() {
  // Mock connection states - In production, these would come from your API
  const connections = {
    hubspot: {
      isConnected: true,
      accountInfo: {
        email: "user@company.com",
        portalId: "12345678",
        lastSync: new Date(Date.now() - 3600000).toISOString()
      }
    },
    google: {
      isConnected: false,
      accountInfo: null
    }
  }

  const handleConnect = (provider: string) => {
    // In production, this would redirect to OAuth flow
    console.log(`Connecting to ${provider}...`)
    // Example: window.location.href = `/api/auth/${provider}`
  }

  const handleDisconnect = (provider: string) => {
    // In production, this would call API to revoke tokens
    console.log(`Disconnecting from ${provider}...`)
  }

  const handleRefresh = (provider: string) => {
    // In production, this would refresh the OAuth token
    console.log(`Refreshing token for ${provider}...`)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Connections</h2>
          <p className="text-muted-foreground">
            Manage your integrations with HubSpot and Google Sheets
          </p>
        </div>

        {/* Connection Status Alert */}
        {!connections.hubspot.isConnected || !connections.google.isConnected ? (
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-base">Setup Required</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Connect both HubSpot and Google Sheets to enable bi-directional sync functionality.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <CardTitle className="text-base">All Systems Connected</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your integrations are active and ready for synchronization.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Connection Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <ConnectionCard
            provider="hubspot"
            isConnected={connections.hubspot.isConnected}
            accountInfo={connections.hubspot.accountInfo}
            onConnect={() => handleConnect("hubspot")}
            onDisconnect={() => handleDisconnect("hubspot")}
            onRefresh={() => handleRefresh("hubspot")}
          />

          <ConnectionCard
            provider="google"
            isConnected={connections.google.isConnected}
            accountInfo={connections.google.accountInfo}
            onConnect={() => handleConnect("google")}
            onDisconnect={() => handleDisconnect("google")}
            onRefresh={() => handleRefresh("google")}
          />
        </div>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>Resources to help you get connected</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <a href="#" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                <ExternalLink className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">HubSpot OAuth Setup Guide</p>
                  <p className="text-xs text-muted-foreground">Learn how to configure OAuth in HubSpot</p>
                </div>
              </a>
              <a href="#" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                <ExternalLink className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Google Cloud Console Setup</p>
                  <p className="text-xs text-muted-foreground">Configure Google Sheets API access</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}