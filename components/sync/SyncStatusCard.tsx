'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, Pause, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncStatusCardProps {
  sync: {
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
  };
  onViewDetails?: (syncId: string) => void;
  onCancel?: (syncId: string) => void;
}

export function SyncStatusCard({ sync, onViewDetails, onCancel }: SyncStatusCardProps) {
  const getStatusConfig = (status: string) => {
    const configs = {
      PENDING: {
        icon: Clock,
        color: 'text-gray-500',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        variant: 'secondary' as const
      },
      IN_PROGRESS: {
        icon: Clock,
        color: 'text-blue-500',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        variant: 'default' as const
      },
      COMPLETED: {
        icon: CheckCircle2,
        color: 'text-green-500',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        variant: 'outline' as const
      },
      FAILED: {
        icon: XCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        variant: 'destructive' as const
      },
      CANCELLED: {
        icon: Pause,
        color: 'text-gray-500',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        variant: 'secondary' as const
      },
    };
    return configs[status as keyof typeof configs] || configs.PENDING;
  };

  const statusConfig = getStatusConfig(sync.status);
  const StatusIcon = statusConfig.icon;

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

  return (
    <Card className={cn('transition-all', statusConfig.bgColor)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-medium">{sync.configName}</CardTitle>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>{formatDate(sync.startedAt)}</span>
              <span>•</span>
              <span>{calculateDuration(sync.startedAt, sync.completedAt)}</span>
            </div>
          </div>
          <Badge variant={statusConfig.variant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {sync.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress Bar for In-Progress Syncs */}
        {sync.status === 'IN_PROGRESS' && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{sync.progress}%</span>
            </div>
            <Progress value={sync.progress} className="h-2" />
          </div>
        )}

        {/* Error Message */}
        {sync.errorMessage && (
          <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/10 p-2 rounded border border-red-200 dark:border-red-800">
            {sync.errorMessage}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-lg font-bold">{sync.recordsProcessed}</div>
            <div className="text-xs text-muted-foreground">Processed</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">{sync.recordsCreated}</div>
            <div className="text-xs text-muted-foreground">Created</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">{sync.recordsUpdated}</div>
            <div className="text-xs text-muted-foreground">Updated</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">{sync.recordsFailed}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails?.(sync.id)}
          >
            <Eye className="h-3 w-3 mr-1" />
            View Details
          </Button>
          {sync.status === 'IN_PROGRESS' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel?.(sync.id)}
            >
              <Pause className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
