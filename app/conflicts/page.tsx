'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Database,
  Cloud,
  GitMerge,
  Filter
} from 'lucide-react';

interface Conflict {
  id: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  hubspotValue: any;
  databaseValue: any;
  resolution?: 'USE_HUBSPOT' | 'USE_DATABASE' | 'MANUAL' | 'MERGE';
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  syncJobId: string;
  configName: string;
}

export default function ConflictsPage() {
  const [filterResolution, setFilterResolution] = useState<string>('unresolved');
  const [filterEntity, setFilterEntity] = useState<string>('all');

  const conflicts: Conflict[] = [
    {
      id: '1',
      entityType: 'CONTACT',
      entityId: 'contact-123',
      fieldName: 'email',
      hubspotValue: 'john.doe@example.com',
      databaseValue: 'j.doe@example.com',
      createdAt: '2025-10-23T10:30:00Z',
      syncJobId: 'job-1',
      configName: 'Contact Sync - Bidirectional',
    },
    {
      id: '2',
      entityType: 'COMPANY',
      entityId: 'company-456',
      fieldName: 'annualRevenue',
      hubspotValue: 1500000,
      databaseValue: 1450000,
      createdAt: '2025-10-23T09:15:00Z',
      syncJobId: 'job-2',
      configName: 'Company Sync - Bidirectional',
    },
    {
      id: '3',
      entityType: 'DEAL',
      entityId: 'deal-789',
      fieldName: 'amount',
      hubspotValue: 50000,
      databaseValue: 48000,
      resolution: 'USE_HUBSPOT',
      resolvedBy: 'admin@company.com',
      resolvedAt: '2025-10-23T11:00:00Z',
      createdAt: '2025-10-23T08:00:00Z',
      syncJobId: 'job-3',
      configName: 'Deal Sync - Bidirectional',
    },
    {
      id: '4',
      entityType: 'CONTACT',
      entityId: 'contact-321',
      fieldName: 'phone',
      hubspotValue: '+1-555-0100',
      databaseValue: '+1-555-0101',
      createdAt: '2025-10-23T10:45:00Z',
      syncJobId: 'job-1',
      configName: 'Contact Sync - Bidirectional',
    },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
  };

  const handleResolve = (conflictId: string, resolution: string) => {
    console.log(`Resolving conflict ${conflictId} with ${resolution}`);
    // TODO: Implement resolution logic
  };

  const handleResolveAll = (resolution: string) => {
    const unresolvedConflicts = conflicts.filter((c) => !c.resolution);
    console.log(`Resolving ${unresolvedConflicts.length} conflicts with ${resolution}`);
    // TODO: Implement batch resolution logic
  };

  const filteredConflicts = conflicts.filter((conflict) => {
    if (filterResolution === 'unresolved' && conflict.resolution) return false;
    if (filterResolution === 'resolved' && !conflict.resolution) return false;
    if (filterEntity !== 'all' && conflict.entityType !== filterEntity) return false;
    return true;
  });

  const unresolvedCount = conflicts.filter((c) => !c.resolution).length;
  const resolvedCount = conflicts.filter((c) => c.resolution).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Conflict Resolution</h1>
            <p className="text-muted-foreground mt-2">
              Resolve data conflicts between HubSpot and your database
            </p>
          </div>
          {unresolvedCount > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleResolveAll('USE_HUBSPOT')}
              >
                Resolve All with HubSpot
              </Button>
              <Button
                variant="outline"
                onClick={() => handleResolveAll('USE_DATABASE')}
              >
                Resolve All with Database
              </Button>
            </div>
          )}
        </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Conflicts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conflicts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unresolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {unresolvedCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {resolvedCount}
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
              <Select value={filterResolution} onValueChange={setFilterResolution}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by resolution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conflicts</SelectItem>
                  <SelectItem value="unresolved">Unresolved</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
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

            {(filterResolution !== 'unresolved' || filterEntity !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setFilterResolution('unresolved');
                  setFilterEntity('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conflicts List */}
      <div className="space-y-4">
        {filteredConflicts.map((conflict) => (
          <Card key={conflict.id} className={conflict.resolution ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{conflict.configName}</CardTitle>
                    <Badge variant="outline">{conflict.entityType}</Badge>
                    {conflict.resolution ? (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Resolved
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Unresolved
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-1">
                    Field: <span className="font-medium">{conflict.fieldName}</span> • Entity ID: {conflict.entityId} •
                    Detected {formatDate(conflict.createdAt)}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Value Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Cloud className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm">HubSpot Value</span>
                  </div>
                  <div className="font-mono text-sm bg-white dark:bg-gray-900 p-2 rounded border">
                    {formatValue(conflict.hubspotValue)}
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm">Database Value</span>
                  </div>
                  <div className="font-mono text-sm bg-white dark:bg-gray-900 p-2 rounded border">
                    {formatValue(conflict.databaseValue)}
                  </div>
                </div>
              </div>

              {/* Resolution Info or Actions */}
              {conflict.resolution ? (
                <div className="bg-secondary/50 rounded-lg p-3 border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        Resolved by: {conflict.resolvedBy}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(conflict.resolvedAt!)} • Resolution: {conflict.resolution.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResolve(conflict.id, 'USE_HUBSPOT')}
                  >
                    <Cloud className="h-4 w-4 mr-2" />
                    Use HubSpot Value
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResolve(conflict.id, 'USE_DATABASE')}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Use Database Value
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResolve(conflict.id, 'MERGE')}
                  >
                    <GitMerge className="h-4 w-4 mr-2" />
                    Merge Values
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredConflicts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-muted-foreground">No conflicts found matching the selected filters.</p>
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}
