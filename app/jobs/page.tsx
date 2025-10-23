'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Pause,
  RotateCw,
  Download,
  Filter
} from 'lucide-react';

interface SyncJob {
  id: string;
  configName: string;
  entityType: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  startedAt: string;
  completedAt?: string;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  progress: number;
  errorMessage?: string;
}

export default function JobsPage() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');

  const jobs: SyncJob[] = [
    {
      id: '1',
      configName: 'Contact Sync - HubSpot to Google Sheets',
      entityType: 'CONTACT',
      status: 'IN_PROGRESS',
      startedAt: '2025-10-23T10:30:00Z',
      recordsProcessed: 750,
      recordsCreated: 150,
      recordsUpdated: 600,
      recordsFailed: 0,
      progress: 75,
    },
    {
      id: '2',
      configName: 'Company Sync - Bidirectional',
      entityType: 'COMPANY',
      status: 'COMPLETED',
      startedAt: '2025-10-23T09:15:00Z',
      completedAt: '2025-10-23T09:45:00Z',
      recordsProcessed: 1000,
      recordsCreated: 50,
      recordsUpdated: 950,
      recordsFailed: 0,
      progress: 100,
    },
    {
      id: '3',
      configName: 'Deal Sync - HubSpot to PostgreSQL',
      entityType: 'DEAL',
      status: 'FAILED',
      startedAt: '2025-10-23T08:00:00Z',
      completedAt: '2025-10-23T08:05:00Z',
      recordsProcessed: 120,
      recordsCreated: 0,
      recordsUpdated: 120,
      recordsFailed: 15,
      progress: 100,
      errorMessage: 'API rate limit exceeded',
    },
    {
      id: '4',
      configName: 'Contact Sync - Google Sheets to HubSpot',
      entityType: 'CONTACT',
      status: 'PENDING',
      startedAt: '2025-10-23T11:00:00Z',
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      progress: 0,
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
      PENDING: { variant: 'secondary', icon: Clock },
      IN_PROGRESS: { variant: 'default', icon: Play },
      COMPLETED: { variant: 'outline', icon: CheckCircle2 },
      FAILED: { variant: 'destructive', icon: XCircle },
      CANCELLED: { variant: 'secondary', icon: Pause },
    };

    const config = variants[status] || variants.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const calculateDuration = (startedAt: string, completedAt?: string) => {
    const start = new Date(startedAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);

    if (diffMins > 0) {
      return `${diffMins}m ${diffSecs}s`;
    }
    return `${diffSecs}s`;
  };

  const filteredJobs = jobs.filter((job) => {
    if (filterStatus !== 'all' && job.status !== filterStatus) return false;
    if (filterEntity !== 'all' && job.entityType !== filterEntity) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sync Jobs</h1>
            <p className="text-muted-foreground mt-2">
              Monitor and manage synchronization jobs
            </p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {jobs.filter((j) => j.status === 'COMPLETED').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {jobs.filter((j) => j.status === 'IN_PROGRESS').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {jobs.filter((j) => j.status === 'FAILED').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {jobs.filter((j) => j.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Select value={filterEntity} onValueChange={setFilterEntity}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entity Types</SelectItem>
                  <SelectItem value="CONTACT">Contacts</SelectItem>
                  <SelectItem value="COMPANY">Companies</SelectItem>
                  <SelectItem value="DEAL">Deals</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(filterStatus !== 'all' || filterEntity !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setFilterStatus('all');
                  setFilterEntity('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.map((job) => (
          <Card key={job.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{job.configName}</CardTitle>
                  <CardDescription className="mt-1">
                    Started {formatDate(job.startedAt)} • Duration: {calculateDuration(job.startedAt, job.completedAt)}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(job.status)}
                  {job.status === 'FAILED' && (
                    <Button variant="outline" size="sm">
                      <RotateCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              {job.status === 'IN_PROGRESS' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{job.progress}%</span>
                  </div>
                  <Progress value={job.progress} />
                </div>
              )}

              {/* Error Message */}
              {job.errorMessage && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-sm text-destructive font-medium">
                    Error: {job.errorMessage}
                  </p>
                </div>
              )}

              {/* Statistics Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="text-2xl font-bold">{job.recordsProcessed.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Processed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{job.recordsCreated.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Created</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{job.recordsUpdated.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Updated</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{job.recordsFailed.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                <Button variant="outline" size="sm">
                  View Logs
                </Button>
                {job.status === 'IN_PROGRESS' && (
                  <Button variant="outline" size="sm">
                    <Pause className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredJobs.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No jobs found matching the selected filters.</p>
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}
