'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncExecutionButtonProps {
  configId: string;
  configName: string;
  onSyncComplete?: (result: any) => void;
  className?: string;
}

export function SyncExecutionButton({
  configId,
  configName,
  onSyncComplete,
  className,
}: SyncExecutionButtonProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const executeSync = async () => {
    setIsExecuting(true);
    setStatus('running');
    setError(null);

    try {
      // TODO: Replace with actual GraphQL mutation
      const response = await fetch('/api/sync/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configId }),
      });

      if (!response.ok) {
        throw new Error('Failed to start sync job');
      }

      const result = await response.json();

      setStatus('success');
      onSyncComplete?.(result);

      // Reset status after 3 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error occurred');

      // Reset status after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setError(null);
      }, 5000);
    } finally {
      setIsExecuting(false);
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case 'running':
        return (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Syncing...
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Sync Started
          </>
        );
      case 'error':
        return (
          <>
            <XCircle className="h-4 w-4 mr-2" />
            Sync Failed
          </>
        );
      default:
        return (
          <>
            <Play className="h-4 w-4 mr-2" />
            Run Sync
          </>
        );
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={executeSync}
        disabled={isExecuting}
        className={cn(
          className,
          status === 'success' && 'bg-green-600 hover:bg-green-700',
          status === 'error' && 'bg-red-600 hover:bg-red-700'
        )}
      >
        {getButtonContent()}
      </Button>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
