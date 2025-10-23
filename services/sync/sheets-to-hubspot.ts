/**
 * Google Sheets to HubSpot Sync Engine
 * Handles syncing data from Google Sheets to HubSpot CRM
 */

import { Client as HubSpotClient } from '@hubspot/api-client';
import { GoogleSheetsClient } from '@/lib/googlesheets/client';
import { prisma } from '@/lib/prisma';
import { Queue } from 'bullmq';

export interface SheetsToHubSpotSyncConfig {
  syncConfigId: string;
  userId: string;
  spreadsheetId: string;
  sheetName: string;
  hubspotEntityType: 'contacts' | 'companies' | 'deals';
  fieldMappings: Array<{
    sheetColumn: string;
    columnIndex: number;
    hubspotProperty: string;
    isRequired: boolean;
    transformType?: string;
  }>;
  identifierColumn: string; // Column to identify records (e.g., email for contacts)
  updateExisting: boolean;
  createNew: boolean;
  skipInvalid: boolean;
}

export interface SheetsSyncResult {
  success: boolean;
  rowsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: Array<{
    row: number;
    data: any;
    error: string;
  }>;
}

export class SheetsToHubSpotSync {
  private hubspotClient: HubSpotClient;
  private sheetsClient: GoogleSheetsClient;
  private syncQueue: Queue;

  constructor(
    hubspotAccessToken: string,
    userId: string
  ) {
    this.hubspotClient = new HubSpotClient({ accessToken: hubspotAccessToken });
    this.sheetsClient = new GoogleSheetsClient(userId);
    this.syncQueue = new Queue('sheets-to-hubspot-sync');
  }

  /**
   * Execute sync from Google Sheets to HubSpot
   */
  async executeSync(config: SheetsToHubSpotSyncConfig): Promise<SheetsSyncResult> {
    const result: SheetsSyncResult = {
      success: false,
      rowsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errors: [],
    };

    // Create sync job
    const syncJob = await prisma.syncJob.create({
      data: {
        syncConfigId: config.syncConfigId,
        status: 'IN_PROGRESS',
      },
    });

    try {
      // Read sheet data
      const sheetData = await this.sheetsClient.readSheet(
        config.spreadsheetId,
        config.sheetName
      );

      // Validate headers match expected columns
      this.validateHeaders(sheetData.headers, config.fieldMappings);

      // Get identifier column index
      const identifierIndex = sheetData.headers.indexOf(config.identifierColumn);
      if (identifierIndex === -1) {
        throw new Error(`Identifier column "${config.identifierColumn}" not found`);
      }

      // Process each row
      for (let rowIndex = 0; rowIndex < sheetData.rows.length; rowIndex++) {
        const row = sheetData.rows[rowIndex];
        const rowNumber = rowIndex + 2; // +2 for header and 1-based index

        try {
          // Skip empty rows
          if (this.isEmptyRow(row)) {
            result.recordsSkipped++;
            continue;
          }

          // Transform row data to HubSpot format
          const hubspotData = await this.transformRowToHubSpot(
            row,
            config.fieldMappings
          );

          // Validate required fields
          const validation = this.validateRequiredFields(
            hubspotData,
            config.fieldMappings
          );

          if (!validation.valid) {
            if (config.skipInvalid) {
              result.recordsSkipped++;
              result.errors.push({
                row: rowNumber,
                data: row,
                error: `Missing required fields: ${validation.missingFields.join(', ')}`,
              });
              continue;
            } else {
              throw new Error(`Row ${rowNumber}: Missing required fields: ${validation.missingFields.join(', ')}`);
            }
          }

          // Check if record exists in HubSpot
          const identifier = row[identifierIndex];
          const existingRecord = await this.findHubSpotRecord(
            config.hubspotEntityType,
            config.identifierColumn,
            identifier
          );

          if (existingRecord) {
            if (config.updateExisting) {
              // Update existing record
              await this.updateHubSpotRecord(
                config.hubspotEntityType,
                existingRecord.id,
                hubspotData
              );
              result.recordsUpdated++;

              // Log the update
              await this.logSyncOperation(
                syncJob.id,
                'UPDATE',
                config.hubspotEntityType,
                existingRecord.id,
                'SUCCESS'
              );
            } else {
              result.recordsSkipped++;
            }
          } else {
            if (config.createNew) {
              // Create new record
              const newRecord = await this.createHubSpotRecord(
                config.hubspotEntityType,
                hubspotData
              );
              result.recordsCreated++;

              // Log the creation
              await this.logSyncOperation(
                syncJob.id,
                'CREATE',
                config.hubspotEntityType,
                newRecord.id,
                'SUCCESS'
              );

              // Update sync state
              await this.updateSyncState(
                config.spreadsheetId,
                newRecord.id,
                rowNumber
              );
            } else {
              result.recordsSkipped++;
            }
          }

          result.rowsProcessed++;

        } catch (error: any) {
          console.error(`Error processing row ${rowNumber}:`, error);
          result.errors.push({
            row: rowNumber,
            data: row,
            error: error.message,
          });

          // Log the error
          await this.logSyncOperation(
            syncJob.id,
            'SKIP',
            config.hubspotEntityType,
            '',
            'ERROR',
            error.message
          );
        }
      }

      result.success = result.errors.length === 0;

      // Update sync job
      await prisma.syncJob.update({
        where: { id: syncJob.id },
        data: {
          status: result.success ? 'COMPLETED' : 'FAILED',
          completedAt: new Date(),
          recordsProcessed: result.rowsProcessed,
          recordsCreated: result.recordsCreated,
          recordsUpdated: result.recordsUpdated,
          recordsFailed: result.errors.length,
          errorMessage: result.errors.length > 0
            ? `${result.errors.length} records failed to sync`
            : undefined,
        },
      });

    } catch (error: any) {
      console.error('Sync error:', error);

      // Update sync job with error
      await prisma.syncJob.update({
        where: { id: syncJob.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: error.message,
        },
      });

      throw error;
    }

    return result;
  }

  /**
   * Validate sheet headers match field mappings
   */
  private validateHeaders(
    headers: string[],
    fieldMappings: any[]
  ): void {
    for (const mapping of fieldMappings) {
      if (!headers.includes(mapping.sheetColumn)) {
        throw new Error(`Column "${mapping.sheetColumn}" not found in sheet`);
      }
    }
  }

  /**
   * Check if a row is empty
   */
  private isEmptyRow(row: any[]): boolean {
    return row.every(cell => !cell || String(cell).trim() === '');
  }

  /**
   * Transform sheet row to HubSpot properties format
   */
  private async transformRowToHubSpot(
    row: any[],
    fieldMappings: any[]
  ): Promise<Record<string, any>> {
    const properties: Record<string, any> = {};

    for (const mapping of fieldMappings) {
      const value = row[mapping.columnIndex];

      if (value !== null && value !== undefined && value !== '') {
        // Apply transformation
        const transformedValue = await this.applyTransformation(
          value,
          mapping.transformType,
          mapping.hubspotProperty
        );

        properties[mapping.hubspotProperty] = transformedValue;
      }
    }

    return properties;
  }

  /**
   * Apply data transformation for HubSpot
   */
  private async applyTransformation(
    value: any,
    transformType?: string,
    propertyName?: string
  ): Promise<any> {
    if (!transformType) return value;

    switch (transformType) {
      case 'DATE_TO_TIMESTAMP':
        // Convert date string to Unix timestamp (milliseconds)
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date.getTime();

      case 'STRING_TO_NUMBER':
        return parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;

      case 'BOOLEAN_TO_STRING':
        return String(value).toLowerCase() === 'true' ? 'true' : 'false';

      case 'TRIM':
        return String(value).trim();

      case 'LOWERCASE':
        return String(value).toLowerCase();

      case 'UPPERCASE':
        return String(value).toUpperCase();

      case 'EMAIL_NORMALIZE':
        return String(value).toLowerCase().trim();

      case 'PHONE_FORMAT':
        // Remove non-numeric characters
        return String(value).replace(/\D/g, '');

      default:
        return value;
    }
  }

  /**
   * Validate required fields
   */
  private validateRequiredFields(
    data: Record<string, any>,
    fieldMappings: any[]
  ): { valid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];

    for (const mapping of fieldMappings) {
      if (mapping.isRequired && !data[mapping.hubspotProperty]) {
        missingFields.push(mapping.sheetColumn);
      }
    }

    return {
      valid: missingFields.length === 0,
      missingFields,
    };
  }

  /**
   * Find existing HubSpot record
   */
  private async findHubSpotRecord(
    entityType: string,
    identifierProperty: string,
    identifierValue: any
  ): Promise<any | null> {
    try {
      let searchResults: any;

      switch (entityType) {
        case 'contacts':
          if (identifierProperty === 'email') {
            searchResults = await this.hubspotClient.crm.contacts.searchApi.doSearch({
              filterGroups: [{
                filters: [{
                  propertyName: 'email',
                  operator: 'EQ' as any, // HubSpot API expects string 'EQ'
                  value: identifierValue,
                }],
              }],
              limit: 1,
            });
          }
          break;

        case 'companies':
          searchResults = await this.hubspotClient.crm.companies.searchApi.doSearch({
            filterGroups: [{
              filters: [{
                propertyName: identifierProperty,
                operator: 'EQ' as any,
                value: identifierValue,
              }],
            }],
            limit: 1,
          });
          break;

        case 'deals':
          searchResults = await this.hubspotClient.crm.deals.searchApi.doSearch({
            filterGroups: [{
              filters: [{
                propertyName: identifierProperty,
                operator: 'EQ' as any,
                value: identifierValue,
              }],
            }],
            limit: 1,
          });
          break;
      }

      return searchResults?.results?.[0] || null;
    } catch (error) {
      console.error('Error searching HubSpot:', error);
      return null;
    }
  }

  /**
   * Create new HubSpot record
   */
  private async createHubSpotRecord(
    entityType: string,
    properties: Record<string, any>
  ): Promise<any> {
    let result: any;

    switch (entityType) {
      case 'contacts':
        result = await this.hubspotClient.crm.contacts.basicApi.create({
          properties,
          associations: [],
        });
        break;

      case 'companies':
        result = await this.hubspotClient.crm.companies.basicApi.create({
          properties,
          associations: [],
        });
        break;

      case 'deals':
        result = await this.hubspotClient.crm.deals.basicApi.create({
          properties,
          associations: [],
        });
        break;

      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }

    return result;
  }

  /**
   * Update existing HubSpot record
   */
  private async updateHubSpotRecord(
    entityType: string,
    recordId: string,
    properties: Record<string, any>
  ): Promise<any> {
    let result: any;

    switch (entityType) {
      case 'contacts':
        result = await this.hubspotClient.crm.contacts.basicApi.update(
          recordId,
          { properties }
        );
        break;

      case 'companies':
        result = await this.hubspotClient.crm.companies.basicApi.update(
          recordId,
          { properties }
        );
        break;

      case 'deals':
        result = await this.hubspotClient.crm.deals.basicApi.update(
          recordId,
          { properties }
        );
        break;

      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }

    return result;
  }

  /**
   * Log sync operation
   */
  private async logSyncOperation(
    syncJobId: string,
    operation: any,
    entityType: any,
    entityId: string,
    status: any,
    message?: string
  ): Promise<void> {
    await prisma.syncLog.create({
      data: {
        syncJobId,
        operation,
        entityType: entityType.toUpperCase(),
        entityId,
        status,
        message,
      },
    });
  }

  /**
   * Update sync state
   */
  private async updateSyncState(
    spreadsheetId: string,
    hubspotEntityId: string,
    sheetRowNumber: number
  ): Promise<void> {
    await prisma.sheetSyncState.upsert({
      where: {
        spreadsheetId_hubspotEntityId: {
          spreadsheetId,
          hubspotEntityId,
        },
      },
      update: {
        sheetRowNumber,
        lastSyncedAt: new Date(),
        syncHash: '', // Will be calculated on next sync
      },
      create: {
        spreadsheetId,
        hubspotEntityId,
        sheetRowNumber,
        lastSyncedAt: new Date(),
        syncHash: '',
      },
    });
  }

  /**
   * Detect changes in sheet since last sync
   */
  async detectChanges(
    spreadsheetId: string,
    sheetName: string
  ): Promise<Array<{ row: number; type: 'new' | 'modified' | 'deleted' }>> {
    const changes: Array<{ row: number; type: 'new' | 'modified' | 'deleted' }> = [];

    // Get current sheet data
    const sheetData = await this.sheetsClient.readSheet(spreadsheetId, sheetName);

    // Get sync states
    const syncStates = await prisma.sheetSyncState.findMany({
      where: { spreadsheetId },
    });

    // Create map of sync states
    const stateMap = new Map<number, string>();
    syncStates.forEach(state => {
      stateMap.set(state.sheetRowNumber, state.syncHash);
    });

    // Check for new and modified rows
    sheetData.rows.forEach((row, index) => {
      const rowNumber = index + 2;
      const currentHash = this.sheetsClient.calculateRowHash(row);
      const existingHash = stateMap.get(rowNumber);

      if (!existingHash) {
        changes.push({ row: rowNumber, type: 'new' });
      } else if (existingHash !== currentHash) {
        changes.push({ row: rowNumber, type: 'modified' });
      }

      stateMap.delete(rowNumber);
    });

    // Remaining items in stateMap are deleted rows
    stateMap.forEach((_, rowNumber) => {
      changes.push({ row: rowNumber, type: 'deleted' });
    });

    return changes;
  }

  /**
   * Schedule periodic sync
   */
  async scheduleSync(
    config: SheetsToHubSpotSyncConfig,
    intervalMinutes: number
  ): Promise<void> {
    await this.syncQueue.add(
      'sync-sheets-to-hubspot',
      config,
      {
        repeat: {
          every: intervalMinutes * 60 * 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );
  }
}