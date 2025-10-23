'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bell, Database, Shield, Zap, Save, Trash2, Key } from 'lucide-react';

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [syncFailures, setSyncFailures] = useState(true);
  const [conflictAlerts, setConflictAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [autoRetry, setAutoRetry] = useState(true);
  const [retryAttempts, setRetryAttempts] = useState('3');
  const [logRetention, setLogRetention] = useState('90');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your sync platform preferences and integrations
        </p>
      </div>

      {/* API Connections */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <CardTitle>API Connections</CardTitle>
          </div>
          <CardDescription>
            Manage your HubSpot and Google Sheets API connections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium">HubSpot</h3>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Connected
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Portal ID: 12345678 • Connected: Oct 15, 2025
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Refresh Token</Button>
              <Button variant="outline" size="sm">Disconnect</Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium">Google Sheets</h3>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Connected
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Account: user@company.com • Connected: Oct 18, 2025
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Refresh Token</Button>
              <Button variant="outline" size="sm">Disconnect</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>
            Choose what notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="email-notifications" className="text-base font-medium">
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Receive email notifications for sync events
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="sync-failures" className="text-base font-medium">
                Sync Failures
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Get notified when a sync job fails
              </p>
            </div>
            <Switch
              id="sync-failures"
              checked={syncFailures}
              onCheckedChange={setSyncFailures}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="conflict-alerts" className="text-base font-medium">
                Conflict Alerts
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Alert me when data conflicts are detected
              </p>
            </div>
            <Switch
              id="conflict-alerts"
              checked={conflictAlerts}
              onCheckedChange={setConflictAlerts}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="weekly-reports" className="text-base font-medium">
                Weekly Reports
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Receive a weekly summary of sync activities
              </p>
            </div>
            <Switch
              id="weekly-reports"
              checked={weeklyReports}
              onCheckedChange={setWeeklyReports}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <CardTitle>Sync Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure global sync behavior and performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="auto-retry" className="text-base font-medium">
                Auto Retry Failed Syncs
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically retry failed sync jobs
              </p>
            </div>
            <Switch
              id="auto-retry"
              checked={autoRetry}
              onCheckedChange={setAutoRetry}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="retry-attempts">Maximum Retry Attempts</Label>
            <Select value={retryAttempts} onValueChange={setRetryAttempts}>
              <SelectTrigger id="retry-attempts">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 attempt</SelectItem>
                <SelectItem value="3">3 attempts</SelectItem>
                <SelectItem value="5">5 attempts</SelectItem>
                <SelectItem value="10">10 attempts</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Number of times to retry a failed sync before giving up
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="batch-size">Batch Size</Label>
            <Input
              id="batch-size"
              type="number"
              placeholder="100"
              defaultValue="100"
            />
            <p className="text-sm text-muted-foreground">
              Number of records to process in each batch (1-1000)
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="rate-limit">API Rate Limit (requests/second)</Label>
            <Input
              id="rate-limit"
              type="number"
              placeholder="10"
              defaultValue="10"
            />
            <p className="text-sm text-muted-foreground">
              Maximum number of API requests per second
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>Data Management</CardTitle>
          </div>
          <CardDescription>
            Manage data retention and storage settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="log-retention">Log Retention Period (days)</Label>
            <Select value={logRetention} onValueChange={setLogRetention}>
              <SelectTrigger id="log-retention">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">180 days</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              How long to keep sync logs and job history
            </p>
          </div>

          <div className="pt-4 border-t space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Database Size</h4>
                <p className="text-sm text-muted-foreground">1.2 GB used of unlimited</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Old Logs
              </Button>
              <Button variant="outline" size="sm">
                Export All Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>
            Security and authentication settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="webhook-secret">Webhook Secret Key</Label>
            <div className="flex gap-2">
              <Input
                id="webhook-secret"
                type="password"
                placeholder="••••••••••••••••"
                defaultValue="secret_key_12345"
              />
              <Button variant="outline">Regenerate</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Secret key for validating incoming webhooks
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="api-key">API Key</Label>
            <div className="flex gap-2">
              <Input
                id="api-key"
                type="password"
                placeholder="••••••••••••••••"
                defaultValue="api_key_67890"
              />
              <Button variant="outline">Copy</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              API key for programmatic access to this platform
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Changes */}
      <div className="flex justify-end gap-2">
        <Button variant="outline">Reset to Defaults</Button>
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
      </div>
    </DashboardLayout>
  );
}
