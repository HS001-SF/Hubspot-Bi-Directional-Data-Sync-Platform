/**
 * API Routes for Google Sheets Sync Operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '@/lib/prisma';
import { GoogleSheetsClient } from '@/lib/googlesheets/client';

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

const syncQueue = new Queue('sheets-sync', { connection });

/**
 * GET /api/sync/google-sheets
 * List all Google Sheets sync configurations
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check
    const userId = 'user-id'; // Get from session

    const syncConfigs = await prisma.syncConfig.findMany({
      where: {
        userId,
        entityType: 'GOOGLE_SHEET',
      },
      include: {
        fieldMappings: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: syncConfigs,
    });
  } catch (error: any) {
    console.error('Error fetching sync configs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sync/google-sheets
 * Create a new sync configuration or trigger a sync
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    // TODO: Add authentication check
    const userId = 'user-id'; // Get from session

    switch (action) {
      case 'create-config':
        return await createSyncConfig(userId, data);

      case 'trigger-sync':
        return await triggerSync(userId, data.configId, data.direction);

      case 'list-sheets':
        return await listGoogleSheets(userId);

      case 'get-sheet-data':
        return await getSheetData(userId, data.spreadsheetId, data.sheetName);

      case 'validate-mapping':
        return await validateFieldMapping(userId, data);

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/sync/google-sheets
 * Update sync configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { configId, ...updateData } = body;

    // TODO: Add authentication check
    const userId = 'user-id'; // Get from session

    const syncConfig = await prisma.syncConfig.update({
      where: {
        id: configId,
        userId, // Ensure user owns this config
      },
      data: updateData,
      include: {
        fieldMappings: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: syncConfig,
    });
  } catch (error: any) {
    console.error('Error updating sync config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sync/google-sheets
 * Delete sync configuration
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('configId');

    if (!configId) {
      return NextResponse.json(
        { success: false, error: 'Config ID is required' },
        { status: 400 }
      );
    }

    // TODO: Add authentication check
    const userId = 'user-id'; // Get from session

    await prisma.syncConfig.delete({
      where: {
        id: configId,
        userId, // Ensure user owns this config
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Sync configuration deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting sync config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Helper: Create sync configuration
 */
async function createSyncConfig(userId: string, data: any) {
  const {
    name,
    description,
    spreadsheetId,
    sheetName,
    hubspotEntityType,
    syncDirection,
    syncInterval,
    fieldMappings,
  } = data;

  // Validate Google Sheets access
  const sheetsClient = new GoogleSheetsClient(userId);

  try {
    // Verify sheet exists and is accessible
    const sheetData = await sheetsClient.readSheet(spreadsheetId, sheetName);

    // Save sheet configuration
    await sheetsClient.saveSheetConfiguration(spreadsheetId, sheetName);

    // Create sync configuration
    const syncConfig = await prisma.syncConfig.create({
      data: {
        name,
        description,
        entityType: 'GOOGLE_SHEET',
        syncDirection,
        syncInterval,
        isActive: true,
        userId,
        fieldMappings: {
          create: fieldMappings,
        },
      },
      include: {
        fieldMappings: true,
      },
    });

    // Save Google Sheet mapping
    const googleSheet = await prisma.googleSheet.findUnique({
      where: { spreadsheetId },
    });

    if (googleSheet) {
      await prisma.googleSheet.update({
        where: { spreadsheetId },
        data: { syncConfigId: syncConfig.id },
      });
    }

    // Schedule recurring sync if interval is specified
    if (syncInterval && syncInterval > 0) {
      await syncQueue.add(
        'schedule-sync',
        {
          configId: syncConfig.id,
          userId,
          direction: syncDirection,
        },
        {
          repeat: {
            every: syncInterval * 60 * 1000, // Convert minutes to milliseconds
          },
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: syncConfig,
      sheet: {
        spreadsheetId,
        sheetName,
        headers: sheetData.headers,
        rowCount: sheetData.rows.length,
      },
    });
  } catch (error: any) {
    throw new Error(`Failed to create sync config: ${error.message}`);
  }
}

/**
 * Helper: Trigger manual sync
 */
async function triggerSync(userId: string, configId: string, direction?: string) {
  const syncConfig = await prisma.syncConfig.findFirst({
    where: {
      id: configId,
      userId,
    },
    include: {
      fieldMappings: true,
    },
  });

  if (!syncConfig) {
    throw new Error('Sync configuration not found');
  }

  const syncDirection = direction || syncConfig.syncDirection;
  let jobName: string;
  let jobData: any;

  // Get Google Sheet info
  const googleSheet = await prisma.googleSheet.findFirst({
    where: { syncConfigId: configId },
  });

  if (!googleSheet) {
    throw new Error('Google Sheet configuration not found');
  }

  // Prepare job based on sync direction
  if (syncDirection === 'HUBSPOT_TO_SHEETS') {
    jobName = 'hubspot-to-sheets-sync';
    jobData = {
      syncConfigId: configId,
      userId,
      spreadsheetId: googleSheet.spreadsheetId,
      sheetName: googleSheet.sheetName,
      hubspotEntityType: getHubSpotEntityType(syncConfig),
      fieldMappings: syncConfig.fieldMappings,
      syncMode: 'update',
    };
  } else if (syncDirection === 'SHEETS_TO_HUBSPOT') {
    jobName = 'sheets-to-hubspot-sync';
    jobData = {
      syncConfigId: configId,
      userId,
      spreadsheetId: googleSheet.spreadsheetId,
      sheetName: googleSheet.sheetName,
      hubspotEntityType: getHubSpotEntityType(syncConfig),
      fieldMappings: syncConfig.fieldMappings,
      identifierColumn: 'email', // TODO: Make configurable
      updateExisting: true,
      createNew: true,
      skipInvalid: false,
    };
  } else {
    // Bidirectional sync - queue both jobs
    const job1 = await syncQueue.add('hubspot-to-sheets-sync', {
      syncConfigId: configId,
      userId,
      spreadsheetId: googleSheet.spreadsheetId,
      sheetName: googleSheet.sheetName,
      hubspotEntityType: getHubSpotEntityType(syncConfig),
      fieldMappings: syncConfig.fieldMappings,
      syncMode: 'update',
    });

    const job2 = await syncQueue.add('sheets-to-hubspot-sync', {
      syncConfigId: configId,
      userId,
      spreadsheetId: googleSheet.spreadsheetId,
      sheetName: googleSheet.sheetName,
      hubspotEntityType: getHubSpotEntityType(syncConfig),
      fieldMappings: syncConfig.fieldMappings,
      identifierColumn: 'email',
      updateExisting: true,
      createNew: true,
      skipInvalid: false,
    });

    return NextResponse.json({
      success: true,
      message: 'Bidirectional sync triggered',
      jobs: [job1.id, job2.id],
    });
  }

  // Queue the sync job
  const job = await syncQueue.add(jobName, jobData);

  return NextResponse.json({
    success: true,
    message: 'Sync triggered successfully',
    jobId: job.id,
  });
}

/**
 * Helper: List available Google Sheets
 */
async function listGoogleSheets(userId: string) {
  const sheetsClient = new GoogleSheetsClient(userId);

  try {
    const sheets = await sheetsClient.listSpreadsheets();

    return NextResponse.json({
      success: true,
      data: sheets,
    });
  } catch (error: any) {
    throw new Error(`Failed to list Google Sheets: ${error.message}`);
  }
}

/**
 * Helper: Get sheet data and headers
 */
async function getSheetData(
  userId: string,
  spreadsheetId: string,
  sheetName: string
) {
  const sheetsClient = new GoogleSheetsClient(userId);

  try {
    const sheetData = await sheetsClient.readSheet(spreadsheetId, sheetName);

    return NextResponse.json({
      success: true,
      data: {
        headers: sheetData.headers,
        rowCount: sheetData.rows.length,
        sampleData: sheetData.rows.slice(0, 5), // First 5 rows as sample
      },
    });
  } catch (error: any) {
    throw new Error(`Failed to read sheet data: ${error.message}`);
  }
}

/**
 * Helper: Validate field mapping
 */
async function validateFieldMapping(userId: string, data: any) {
  const { spreadsheetId, sheetName, fieldMappings, hubspotEntityType } = data;

  const sheetsClient = new GoogleSheetsClient(userId);

  try {
    // Get sheet headers
    const sheetData = await sheetsClient.readSheet(spreadsheetId, sheetName);

    // Validate sheet columns exist
    const errors: string[] = [];
    const validMappings: any[] = [];

    for (const mapping of fieldMappings) {
      const columnIndex = sheetData.headers.indexOf(mapping.sheetColumn);

      if (columnIndex === -1) {
        errors.push(`Column "${mapping.sheetColumn}" not found in sheet`);
      } else {
        validMappings.push({
          ...mapping,
          columnIndex,
        });
      }
    }

    // TODO: Validate HubSpot properties exist
    // This would require fetching HubSpot property schema

    return NextResponse.json({
      success: errors.length === 0,
      data: {
        valid: errors.length === 0,
        errors,
        validMappings,
      },
    });
  } catch (error: any) {
    throw new Error(`Failed to validate field mapping: ${error.message}`);
  }
}

/**
 * Helper: Get HubSpot entity type from sync config
 */
function getHubSpotEntityType(syncConfig: any): string {
  // Extract from field mappings or metadata
  // This is a simplified version - you might store this differently
  return 'contacts'; // Default to contacts for now
}