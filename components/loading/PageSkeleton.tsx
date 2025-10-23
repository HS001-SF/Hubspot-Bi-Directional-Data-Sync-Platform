import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sync Configs */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-64" />
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SyncConfigsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-6 w-64 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div>
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function JobsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Skeleton className="h-5 w-72 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j}>
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-9 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ConflictsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-52" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conflicts */}
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-5 w-64" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-4 w-96" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-9 w-44" />
                <Skeleton className="h-9 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
