/**
 * HubSpot to Google Sheets Sync Engine
 * Handles syncing data from HubSpot CRM to Google Sheets
 */

import { Client as HubSpotClient } from '@hubspot/api-client';
import { GoogleSheetsClient } from '@/lib/googlesheets/client';
import { prisma } from '@/lib/prisma';
import { Queue } from 'bullmq';

export interface HubSpotToSheetsSyncConfig {
  syncConfigId: string;
  userId: string;
  spreadsheetId: string;
  sheetName: string;
  hubspotEntityType: 'contacts' | 'companies' | 'deals';
  fieldMappings: Array<{
    hubspotProperty: string;
    sheetColumn: string;
    columnIndex: number;
    transformType?: string;
  }>;
  syncMode: 'overwrite' | 'append' | 'update';
  keyColumn?: string; // Column to use for matching records (e.g., email for contacts)
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: Array<{ record: any; error: string }>;
}

export class HubSpotToSheetsSync {
  private hubspotClient: HubSpotClient;
  private sheetsClient: GoogleSheetsClient;
  private syncQueue: Queue;

  constructor(
    hubspotAccessToken: string,
    userId: string
  ) {
    this.hubspotClient = new HubSpotClient({ accessToken: hubspotAccessToken });
    this.sheetsClient = new GoogleSheetsClient(userId);
    this.syncQueue = new Queue('hubspot-to-sheets-sync');
  }

  /**
   * Execute sync from HubSpot to Google Sheets
   */
  async executeSync(config: HubSpotToSheetsSyncConfig): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      recordsProcessed: 0,
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
      // Fetch HubSpot data
      const hubspotData = await this.fetchHubSpotData(
        config.hubspotEntityType,
        config.fieldMappings.map(m => m.hubspotProperty)
      );

      // Read existing sheet data
      const sheetData = await this.sheetsClient.readSheet(
        config.spreadsheetId,
        config.sheetName
      );

      // Prepare headers if needed
      const headers = this.prepareHeaders(config.fieldMappings);

      // Transform HubSpot data to sheet format
      const transformedData = await this.transformData(
        hubspotData,
        config.fieldMappings
      );

      // Execute based on sync mode
      switch (config.syncMode) {
        case 'overwrite':
          await this.overwriteSheet(
            config.spreadsheetId,
            config.sheetName,
            headers,
            transformedData
          );
          result.recordsCreated = transformedData.length;
          break;

        case 'append':
          await this.appendToSheet(
            config.spreadsheetId,
            config.sheetName,
            transformedData
          );
          result.recordsCreated = transformedData.length;
          break;

        case 'update':
          const updateResult = await this.updateSheet(
            config.spreadsheetId,
            config.sheetName,
            sheetData,
            transformedData,
            config.keyColumn || 'email'
          );
          result.recordsUpdated = updateResult.updated;
          result.recordsCreated = updateResult.created;
          result.recordsSkipped = updateResult.skipped;
          break;
      }

      result.recordsProcessed = hubspotData.length;
      result.success = true;

      // Update sync job
      await prisma.syncJob.update({
        where: { id: syncJob.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          recordsProcessed: result.recordsProcessed,
          recordsCreated: result.recordsCreated,
          recordsUpdated: result.recordsUpdated,
          recordsFailed: result.errors.length,
        },
      });

      // Update sync state
      await this.updateSyncState(
        config.spreadsheetId,
        transformedData
      );

    } catch (error: any) {
      console.error('Sync error:', error);
      result.errors.push({ record: null, error: error.message });

      // Update sync job with error
      await prisma.syncJob.update({
        where: { id: syncJob.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: error.message,
        },
      });
    }

    return result;
  }

  /**
   * Fetch data from HubSpot
   */
  private async fetchHubSpotData(
    entityType: string,
    properties: string[]
  ): Promise<any[]> {
    const results: any[] = [];
    let after: string | undefined;
    const limit = 100;

    do {
      let response: any;

      switch (entityType) {
        case 'contacts':
          response = await this.hubspotClient.crm.contacts.basicApi.getPage(
            limit,
            after,
            properties,
            undefined,
            undefined,
            false
          );
          break;

        case 'companies':
          response = await this.hubspotClient.crm.companies.basicApi.getPage(
            limit,
            after,
            properties,
            undefined,
            undefined,
            false
          );
          break;

        case 'deals':
          response = await this.hubspotClient.crm.deals.basicApi.getPage(
            limit,
            after,
            properties,
            undefined,
            undefined,
            false
          );
          break;

        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }

      results.push(...response.results);
      after = response.paging?.next?.after;

    } while (after);

    return results;
  }

  /**
   * Transform HubSpot data to sheet format
   */
  private async transformData(
    hubspotRecords: any[],
    fieldMappings: any[]
  ): Promise<any[][]> {
    const transformedRows: any[][] = [];

    for (const record of hubspotRecords) {
      const row: any[] = new Array(fieldMappings.length);

      for (let i = 0; i < fieldMappings.length; i++) {
        const mapping = fieldMappings[i];
        let value = record.properties?.[mapping.hubspotProperty];

        // Apply transformation if needed
        value = await this.applyTransformation(
          value,
          mapping.transformType
        );

        row[mapping.columnIndex] = value || '';
      }

      // Add HubSpot ID as first column for tracking
      row.unshift(record.id);
      transformedRows.push(row);
    }

    return transformedRows;
  }

  /**
   * Apply data transformation
   */
  private async applyTransformation(
    value: any,
    transformType?: string
  ): Promise<any> {
    if (!transformType || !value) return value;

    switch (transformType) {
      case 'DATE_FORMAT':
        return value ? new Date(value).toLocaleDateString() : '';

      case 'UPPERCASE':
        return String(value).toUpperCase();

      case 'LOWERCASE':
        return String(value).toLowerCase();

      case 'NUMBER':
        return parseFloat(value) || 0;

      case 'BOOLEAN':
        return value === 'true' || value === true ? 'TRUE' : 'FALSE';

      default:
        return value;
    }
  }

  /**
   * Prepare headers for the sheet
   */
  private prepareHeaders(fieldMappings: any[]): string[] {
    const headers = ['HubSpot ID']; // Always include ID

    fieldMappings
      .sort((a, b) => a.columnIndex - b.columnIndex)
      .forEach(mapping => {
        headers.push(mapping.sheetColumn);
      });

    return headers;
  }

  /**
   * Overwrite entire sheet with new data
   */
  private async overwriteSheet(
    spreadsheetId: string,
    sheetName: string,
    headers: string[],
    data: any[][]
  ): Promise<void> {
    // Clear existing data
    await this.sheetsClient.clearRange(spreadsheetId, sheetName, 'A:Z');

    // Write headers and data
    const allData = [headers, ...data];
    await this.sheetsClient.writeSheet(
      spreadsheetId,
      sheetName,
      allData,
      'A1'
    );
  }

  /**
   * Append data to existing sheet
   */
  private async appendToSheet(
    spreadsheetId: string,
    sheetName: string,
    data: any[][]
  ): Promise<void> {
    await this.sheetsClient.appendToSheet(
      spreadsheetId,
      sheetName,
      data
    );
  }

  /**
   * Update existing sheet with smart matching
   */
  private async updateSheet(
    spreadsheetId: string,
    sheetName: string,
    existingData: any,
    newData: any[][],
    keyColumn: string
  ): Promise<{ updated: number; created: number; skipped: number }> {
    let updated = 0;
    let created = 0;
    let skipped = 0;

    // Find key column index
    const keyColumnIndex = existingData.headers.indexOf(keyColumn);
    if (keyColumnIndex === -1) {
      throw new Error(`Key column "${keyColumn}" not found in sheet`);
    }

    // Create map of existing records
    const existingRecords = new Map<string, number>();
    existingData.rows.forEach((row: any[], index: number) => {
      const key = row[keyColumnIndex];
      if (key) {
        existingRecords.set(String(key), index + 2); // +2 for header and 1-based index
      }
    });

    const updates: Array<{ range: string; values: any[][] }> = [];
    const appends: any[][] = [];

    // Process new data
    for (const row of newData) {
      const keyValue = row[keyColumnIndex + 1]; // +1 because we added HubSpot ID

      if (!keyValue) {
        skipped++;
        continue;
      }

      const existingRowNumber = existingRecords.get(String(keyValue));

      if (existingRowNumber) {
        // Update existing record
        updates.push({
          range: `'${sheetName}'!A${existingRowNumber}`,
          values: [row],
        });
        updated++;
      } else {
        // New record to append
        appends.push(row);
        created++;
      }
    }

    // Execute updates
    if (updates.length > 0) {
      await this.sheetsClient.updateCells(spreadsheetId, updates);
    }

    // Execute appends
    if (appends.length > 0) {
      await this.sheetsClient.appendToSheet(spreadsheetId, sheetName, appends);
    }

    return { updated, created, skipped };
  }

  /**
   * Update sync state tracking
   */
  private async updateSyncState(
    spreadsheetId: string,
    data: any[][]
  ): Promise<void> {
    const syncStates = data.map((row, index) => ({
      spreadsheetId,
      hubspotEntityId: row[0], // First column is HubSpot ID
      sheetRowNumber: index + 2, // +2 for header and 1-based index
      lastSyncedAt: new Date(),
      syncHash: this.sheetsClient.calculateRowHash(row),
    }));

    // Batch upsert sync states
    for (const state of syncStates) {
      await prisma.sheetSyncState.upsert({
        where: {
          spreadsheetId_hubspotEntityId: {
            spreadsheetId: state.spreadsheetId,
            hubspotEntityId: state.hubspotEntityId,
          },
        },
        update: {
          sheetRowNumber: state.sheetRowNumber,
          lastSyncedAt: state.lastSyncedAt,
          syncHash: state.syncHash,
        },
        create: state,
      });
    }
  }

  /**
   * Schedule periodic sync
   */
  async scheduleSync(
    config: HubSpotToSheetsSyncConfig,
    intervalMinutes: number
  ): Promise<void> {
    await this.syncQueue.add(
      'sync-hubspot-to-sheets',
      config,
      {
        repeat: {
          every: intervalMinutes * 60 * 1000, // Convert to milliseconds
        },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );
  }
}