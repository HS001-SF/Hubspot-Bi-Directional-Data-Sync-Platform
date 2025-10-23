'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ArrowRight, Save } from 'lucide-react';

interface FieldMapping {
  id: string;
  sourceField: string;
  targetField: string;
  transformType: string;
  isRequired: boolean;
}

export default function FieldMappingsPage() {
  const [mappings, setMappings] = useState<FieldMapping[]>([
    {
      id: '1',
      sourceField: 'email',
      targetField: 'Email',
      transformType: 'DIRECT',
      isRequired: true,
    },
    {
      id: '2',
      sourceField: 'firstname',
      targetField: 'First Name',
      transformType: 'DIRECT',
      isRequired: false,
    },
  ]);

  const [selectedConfig, setSelectedConfig] = useState('contact-sync');

  const sourceFields = [
    'email',
    'firstname',
    'lastname',
    'phone',
    'company',
    'jobtitle',
    'createdate',
    'lastmodifieddate',
  ];

  const targetFields = [
    'Email',
    'First Name',
    'Last Name',
    'Phone',
    'Company',
    'Job Title',
    'Created Date',
    'Modified Date',
  ];

  const transformTypes = [
    { value: 'DIRECT', label: 'Direct Copy' },
    { value: 'DATE_FORMAT', label: 'Date Format' },
    { value: 'CASE_CHANGE', label: 'Case Change' },
    { value: 'VALUE_MAP', label: 'Value Mapping' },
    { value: 'CUSTOM_FUNCTION', label: 'Custom Function' },
  ];

  const addMapping = () => {
    setMappings([
      ...mappings,
      {
        id: Date.now().toString(),
        sourceField: '',
        targetField: '',
        transformType: 'DIRECT',
        isRequired: false,
      },
    ]);
  };

  const removeMapping = (id: string) => {
    setMappings(mappings.filter((m) => m.id !== id));
  };

  const updateMapping = (id: string, field: keyof FieldMapping, value: any) => {
    setMappings(
      mappings.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const saveMappings = () => {
    console.log('Saving mappings:', mappings);
    // TODO: Implement save logic
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Field Mappings</h1>
          <p className="text-muted-foreground mt-2">
            Configure how fields are mapped between HubSpot and your destination
          </p>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Sync Configuration</CardTitle>
          <CardDescription>
            Choose the sync configuration to manage field mappings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedConfig} onValueChange={setSelectedConfig}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select configuration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contact-sync">Contact Sync - HubSpot to Google Sheets</SelectItem>
              <SelectItem value="company-sync">Company Sync - Bidirectional</SelectItem>
              <SelectItem value="deal-sync">Deal Sync - HubSpot to PostgreSQL</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Field Mappings</CardTitle>
            <CardDescription>
              Map source fields to destination fields and configure transformations
            </CardDescription>
          </div>
          <Button onClick={addMapping}>
            <Plus className="h-4 w-4 mr-2" />
            Add Mapping
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
              <div className="col-span-4">Source Field (HubSpot)</div>
              <div className="col-span-1"></div>
              <div className="col-span-4">Target Field (Destination)</div>
              <div className="col-span-2">Transform</div>
              <div className="col-span-1"></div>
            </div>

            {/* Mappings */}
            {mappings.map((mapping) => (
              <div key={mapping.id} className="grid grid-cols-12 gap-4 items-start">
                <div className="col-span-4">
                  <Select
                    value={mapping.sourceField}
                    onValueChange={(value) => updateMapping(mapping.id, 'sourceField', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source field" />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceFields.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-1 flex items-center justify-center pt-2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="col-span-4">
                  <Select
                    value={mapping.targetField}
                    onValueChange={(value) => updateMapping(mapping.id, 'targetField', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target field" />
                    </SelectTrigger>
                    <SelectContent>
                      {targetFields.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Select
                    value={mapping.transformType}
                    onValueChange={(value) => updateMapping(mapping.id, 'transformType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {transformTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-1 flex items-center gap-2 pt-2">
                  {mapping.isRequired && (
                    <Badge variant="secondary" className="text-xs">
                      Required
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMapping(mapping.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}

            {mappings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No field mappings configured. Click "Add Mapping" to get started.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
            <Button variant="outline">Cancel</Button>
            <Button onClick={saveMappings}>
              <Save className="h-4 w-4 mr-2" />
              Save Mappings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mapping Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Mappings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mappings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Required Fields
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mappings.filter((m) => m.isRequired).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              With Transformations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mappings.filter((m) => m.transformType !== 'DIRECT').length}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </DashboardLayout>
  );
}
