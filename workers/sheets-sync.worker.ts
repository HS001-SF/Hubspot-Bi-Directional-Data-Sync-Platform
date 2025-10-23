/**
 * Google Sheets Sync Background Worker
 * Processes sync jobs between HubSpot and Google Sheets
 */

import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { HubSpotToSheetsSync } from '@/services/sync/hubspot-to-sheets';
import { SheetsToHubSpotSync } from '@/services/sync/sheets-to-hubspot';
import { prisma } from '@/lib/prisma';

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

/**
 * HubSpot to Google Sheets Worker
 */
export const hubspotToSheetsWorker = new Worker(
  'hubspot-to-sheets-sync',
  async (job: Job) => {
    console.log(`Processing HubSpot to Sheets sync job ${job.id}`);

    const config = job.data;

    try {
      // Update job progress
      await job.updateProgress(10);

      // Get user's HubSpot access token
      const account = await prisma.account.findFirst({
        where: { userId: config.userId },
        select: { accessToken: true },
      });

      if (!account?.accessToken) {
        throw new Error('HubSpot account not connected');
      }

      // Initialize sync engine
      const syncEngine = new HubSpotToSheetsSync(
        account.accessToken,
        config.userId
      );

      // Update progress
      await job.updateProgress(20);

      // Execute sync
      const result = await syncEngine.executeSync(config);

      // Update progress
      await job.updateProgress(90);

      // Send notification (optional)
      await sendSyncNotification(config.userId, 'hubspot-to-sheets', result);

      // Update progress
      await job.updateProgress(100);

      return result;
    } catch (error: any) {
      console.error(`HubSpot to Sheets sync job ${job.id} failed:`, error);

      // Send error notification
      await sendErrorNotification(
        config.userId,
        'hubspot-to-sheets',
        error.message
      );

      throw error;
    }
  },
  {
    connection,
    concurrency: 3, // Process 3 jobs concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60000, // per minute
    },
  }
);

/**
 * Google Sheets to HubSpot Worker
 */
export const sheetsToHubspotWorker = new Worker(
  'sheets-to-hubspot-sync',
  async (job: Job) => {
    console.log(`Processing Sheets to HubSpot sync job ${job.id}`);

    const config = job.data;

    try {
      // Update job progress
      await job.updateProgress(10);

      // Get user's HubSpot access token
      const account = await prisma.account.findFirst({
        where: { userId: config.userId },
        select: { accessToken: true },
      });

      if (!account?.accessToken) {
        throw new Error('HubSpot account not connected');
      }

      // Initialize sync engine
      const syncEngine = new SheetsToHubSpotSync(
        account.accessToken,
        config.userId
      );

      // Update progress
      await job.updateProgress(20);

      // Execute sync
      const result = await syncEngine.executeSync(config);

      // Update progress
      await job.updateProgress(90);

      // Send notification
      await sendSyncNotification(config.userId, 'sheets-to-hubspot', result);

      // Update progress
      await job.updateProgress(100);

      return result;
    } catch (error: any) {
      console.error(`Sheets to HubSpot sync job ${job.id} failed:`, error);

      // Send error notification
      await sendErrorNotification(
        config.userId,
        'sheets-to-hubspot',
        error.message
      );

      throw error;
    }
  },
  {
    connection,
    concurrency: 3,
    limiter: {
      max: 10,
      duration: 60000,
    },
  }
);

/**
 * Change Detection Worker
 * Monitors Google Sheets for changes and triggers sync
 */
export const changeDetectionWorker = new Worker(
  'sheets-change-detection',
  async (job: Job) => {
    console.log(`Processing change detection job ${job.id}`);

    const { userId, spreadsheetId, sheetName, syncConfigId } = job.data;

    try {
      // Get user's Google access token
      const account = await prisma.account.findFirst({
        where: { userId },
        select: {
          googleAccessToken: true,
          accessToken: true,
        },
      });

      if (!account?.googleAccessToken) {
        throw new Error('Google account not connected');
      }

      // Initialize sync engine
      const syncEngine = new SheetsToHubSpotSync(
        account.accessToken!,
        userId
      );

      // Detect changes
      const changes = await syncEngine.detectChanges(spreadsheetId, sheetName);

      if (changes.length > 0) {
        console.log(`Detected ${changes.length} changes in sheet ${sheetName}`);

        // Get sync configuration
        const syncConfig = await prisma.syncConfig.findUnique({
          where: { id: syncConfigId },
          include: { fieldMappings: true },
        });

        if (syncConfig?.isActive) {
          // Queue sync job for changed rows
          const syncQueue = job.queue;
          await syncQueue.add('sheets-to-hubspot-sync', {
            ...syncConfig,
            userId,
            changes,
          });
        }
      }

      return { changesDetected: changes.length };
    } catch (error: any) {
      console.error(`Change detection job ${job.id} failed:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

/**
 * Cleanup Worker
 * Removes old sync logs and states
 */
export const cleanupWorker = new Worker(
  'sync-cleanup',
  async (job: Job) => {
    console.log(`Processing cleanup job ${job.id}`);

    const { daysToKeep = 30 } = job.data;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Delete old sync logs
      const deletedLogs = await prisma.syncLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      // Delete old completed sync jobs
      const deletedJobs = await prisma.syncJob.deleteMany({
        where: {
          AND: [
            {
              completedAt: {
                lt: cutoffDate,
              },
            },
            {
              status: {
                in: ['COMPLETED', 'FAILED', 'CANCELLED'],
              },
            },
          ],
        },
      });

      console.log(`Cleanup completed: ${deletedLogs.count} logs, ${deletedJobs.count} jobs deleted`);

      return {
        deletedLogs: deletedLogs.count,
        deletedJobs: deletedJobs.count,
      };
    } catch (error: any) {
      console.error(`Cleanup job ${job.id} failed:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 1,
  }
);

/**
 * Send sync completion notification
 */
async function sendSyncNotification(
  userId: string,
  syncType: string,
  result: any
): Promise<void> {
  // Implementation depends on your notification system
  // Could be email, in-app notification, webhook, etc.

  console.log(`Sync completed for user ${userId}:`, {
    type: syncType,
    recordsProcessed: result.recordsProcessed || result.rowsProcessed,
    recordsCreated: result.recordsCreated,
    recordsUpdated: result.recordsUpdated,
    errors: result.errors?.length || 0,
  });

  // Example: Save notification to database
  // await prisma.notification.create({
  //   data: {
  //     userId,
  //     type: 'SYNC_COMPLETED',
  //     title: `${syncType} sync completed`,
  //     message: `Processed ${result.recordsProcessed} records`,
  //     metadata: result,
  //   },
  // });
}

/**
 * Send error notification
 */
async function sendErrorNotification(
  userId: string,
  syncType: string,
  errorMessage: string
): Promise<void> {
  console.error(`Sync error for user ${userId}:`, {
    type: syncType,
    error: errorMessage,
  });

  // Example: Save error notification to database
  // await prisma.notification.create({
  //   data: {
  //     userId,
  //     type: 'SYNC_ERROR',
  //     title: `${syncType} sync failed`,
  //     message: errorMessage,
  //     severity: 'ERROR',
  //   },
  // });
}

// Event handlers
hubspotToSheetsWorker.on('completed', (job) => {
  console.log(`HubSpot to Sheets sync job ${job.id} completed successfully`);
});

hubspotToSheetsWorker.on('failed', (job, err) => {
  console.error(`HubSpot to Sheets sync job ${job?.id} failed:`, err);
});

sheetsToHubspotWorker.on('completed', (job) => {
  console.log(`Sheets to HubSpot sync job ${job.id} completed successfully`);
});

sheetsToHubspotWorker.on('failed', (job, err) => {
  console.error(`Sheets to HubSpot sync job ${job?.id} failed:`, err);
});

changeDetectionWorker.on('completed', (job) => {
  console.log(`Change detection job ${job.id} completed`);
});

cleanupWorker.on('completed', (job) => {
  console.log(`Cleanup job ${job.id} completed`);
});

// Export workers
export default {
  hubspotToSheetsWorker,
  sheetsToHubspotWorker,
  changeDetectionWorker,
  cleanupWorker,
};