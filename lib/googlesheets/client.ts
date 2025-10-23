/**
 * Google Sheets API Client Wrapper
 * Provides high-level methods for interacting with Google Sheets
 */

import { sheets_v4, drive_v3 } from 'googleapis';
import { googleAuth } from './auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export interface SheetData {
  spreadsheetId: string;
  spreadsheetName: string;
  sheetName: string;
  sheetId: number;
  headers: string[];
  rows: any[][];
}

export interface SheetMetadata {
  spreadsheetId: string;
  title: string;
  sheets: Array<{
    sheetId: number;
    title: string;
    rowCount: number;
    columnCount: number;
  }>;
  lastModifiedTime: Date;
}

export interface SheetUpdateResult {
  updatedRows: number;
  updatedCells: number;
  updatedColumns: number;
  updatedRange: string;
}

export class GoogleSheetsClient {
  private userId: string;
  private sheetsClient: sheets_v4.Sheets | null = null;
  private driveClient: drive_v3.Drive | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Initialize the Sheets API client
   */
  private async initSheetsClient(): Promise<sheets_v4.Sheets> {
    if (!this.sheetsClient) {
      this.sheetsClient = await googleAuth.getAuthenticatedClient(this.userId);
    }
    return this.sheetsClient;
  }

  /**
   * Initialize the Drive API client
   */
  private async initDriveClient(): Promise<drive_v3.Drive> {
    if (!this.driveClient) {
      this.driveClient = await googleAuth.getAuthenticatedDriveClient(this.userId);
    }
    return this.driveClient;
  }

  /**
   * Get spreadsheet metadata
   */
  async getSpreadsheetMetadata(spreadsheetId: string): Promise<SheetMetadata> {
    const sheets = await this.initSheetsClient();
    const drive = await this.initDriveClient();

    try {
      // Get spreadsheet info
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId,
        includeGridData: false,
      });

      // Get file metadata from Drive for last modified time
      const file = await drive.files.get({
        fileId: spreadsheetId,
        fields: 'modifiedTime',
      });

      return {
        spreadsheetId,
        title: spreadsheet.data.properties?.title || '',
        sheets: spreadsheet.data.sheets?.map((sheet) => ({
          sheetId: sheet.properties?.sheetId || 0,
          title: sheet.properties?.title || '',
          rowCount: sheet.properties?.gridProperties?.rowCount || 0,
          columnCount: sheet.properties?.gridProperties?.columnCount || 0,
        })) || [],
        lastModifiedTime: new Date(file.data.modifiedTime || Date.now()),
      };
    } catch (error: any) {
      console.error('Error getting spreadsheet metadata:', error);
      throw new Error(`Failed to get spreadsheet metadata: ${error.message}`);
    }
  }

  /**
   * Read data from a specific sheet
   */
  async readSheet(
    spreadsheetId: string,
    sheetName: string = 'Sheet1',
    range?: string
  ): Promise<SheetData> {
    const sheets = await this.initSheetsClient();

    try {
      const fullRange = range ? `'${sheetName}'!${range}` : `'${sheetName}'`;

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: fullRange,
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING',
      });

      const rows = response.data.values || [];
      const headers = rows.length > 0 ? rows[0] : [];
      const dataRows = rows.slice(1);

      // Get sheet metadata
      const metadata = await this.getSpreadsheetMetadata(spreadsheetId);
      const sheetInfo = metadata.sheets.find(s => s.title === sheetName);

      return {
        spreadsheetId,
        spreadsheetName: metadata.title,
        sheetName,
        sheetId: sheetInfo?.sheetId || 0,
        headers: headers.map(h => String(h)),
        rows: dataRows,
      };
    } catch (error: any) {
      console.error('Error reading sheet:', error);
      throw new Error(`Failed to read sheet: ${error.message}`);
    }
  }

  /**
   * Write data to a sheet (overwrite)
   */
  async writeSheet(
    spreadsheetId: string,
    sheetName: string,
    data: any[][],
    startCell: string = 'A1'
  ): Promise<SheetUpdateResult> {
    const sheets = await this.initSheetsClient();

    try {
      const range = `'${sheetName}'!${startCell}`;

      const response = await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: data,
        },
      });

      return {
        updatedRows: response.data.updatedRows || 0,
        updatedCells: response.data.updatedCells || 0,
        updatedColumns: response.data.updatedColumns || 0,
        updatedRange: response.data.updatedRange || '',
      };
    } catch (error: any) {
      console.error('Error writing to sheet:', error);
      throw new Error(`Failed to write to sheet: ${error.message}`);
    }
  }

  /**
   * Append data to a sheet
   */
  async appendToSheet(
    spreadsheetId: string,
    sheetName: string,
    data: any[][]
  ): Promise<SheetUpdateResult> {
    const sheets = await this.initSheetsClient();

    try {
      const range = `'${sheetName}'`;

      const response = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: data,
        },
      });

      return {
        updatedRows: response.data.updates?.updatedRows || 0,
        updatedCells: response.data.updates?.updatedCells || 0,
        updatedColumns: response.data.updates?.updatedColumns || 0,
        updatedRange: response.data.updates?.updatedRange || '',
      };
    } catch (error: any) {
      console.error('Error appending to sheet:', error);
      throw new Error(`Failed to append to sheet: ${error.message}`);
    }
  }

  /**
   * Update specific cells in a sheet
   */
  async updateCells(
    spreadsheetId: string,
    updates: Array<{ range: string; values: any[][] }>
  ): Promise<number> {
    const sheets = await this.initSheetsClient();

    try {
      const response = await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: updates.map(update => ({
            range: update.range,
            values: update.values,
          })),
        },
      });

      return response.data.totalUpdatedCells || 0;
    } catch (error: any) {
      console.error('Error updating cells:', error);
      throw new Error(`Failed to update cells: ${error.message}`);
    }
  }

  /**
   * Clear a range of cells
   */
  async clearRange(
    spreadsheetId: string,
    sheetName: string,
    range: string
  ): Promise<void> {
    const sheets = await this.initSheetsClient();

    try {
      const fullRange = `'${sheetName}'!${range}`;

      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: fullRange,
      });
    } catch (error: any) {
      console.error('Error clearing range:', error);
      throw new Error(`Failed to clear range: ${error.message}`);
    }
  }

  /**
   * Create a new sheet in a spreadsheet
   */
  async createSheet(
    spreadsheetId: string,
    sheetName: string
  ): Promise<number> {
    const sheets = await this.initSheetsClient();

    try {
      const response = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            },
          ],
        },
      });

      const sheetId = response.data.replies?.[0]?.addSheet?.properties?.sheetId;
      return sheetId || 0;
    } catch (error: any) {
      console.error('Error creating sheet:', error);
      throw new Error(`Failed to create sheet: ${error.message}`);
    }
  }

  /**
   * Delete a sheet from a spreadsheet
   */
  async deleteSheet(spreadsheetId: string, sheetId: number): Promise<void> {
    const sheets = await this.initSheetsClient();

    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              deleteSheet: {
                sheetId,
              },
            },
          ],
        },
      });
    } catch (error: any) {
      console.error('Error deleting sheet:', error);
      throw new Error(`Failed to delete sheet: ${error.message}`);
    }
  }

  /**
   * Get all spreadsheets accessible by the user
   */
  async listSpreadsheets(pageSize: number = 100): Promise<Array<{
    id: string;
    name: string;
    modifiedTime: Date;
  }>> {
    const drive = await this.initDriveClient();

    try {
      const response = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.spreadsheet'",
        pageSize,
        fields: 'files(id, name, modifiedTime)',
        orderBy: 'modifiedTime desc',
      });

      return response.data.files?.map(file => ({
        id: file.id || '',
        name: file.name || '',
        modifiedTime: new Date(file.modifiedTime || Date.now()),
      })) || [];
    } catch (error: any) {
      console.error('Error listing spreadsheets:', error);
      throw new Error(`Failed to list spreadsheets: ${error.message}`);
    }
  }

  /**
   * Find rows matching criteria
   */
  async findRows(
    spreadsheetId: string,
    sheetName: string,
    columnIndex: number,
    value: any
  ): Promise<number[]> {
    const sheetData = await this.readSheet(spreadsheetId, sheetName);
    const matchingRows: number[] = [];

    sheetData.rows.forEach((row, index) => {
      if (row[columnIndex] === value) {
        matchingRows.push(index + 2); // +2 because rows start at 1 and we skip headers
      }
    });

    return matchingRows;
  }

  /**
   * Update specific row
   */
  async updateRow(
    spreadsheetId: string,
    sheetName: string,
    rowNumber: number,
    data: any[]
  ): Promise<SheetUpdateResult> {
    const range = `'${sheetName}'!A${rowNumber}`;

    return await this.updateCells(spreadsheetId, [{
      range,
      values: [data],
    }]).then(updatedCells => ({
      updatedRows: 1,
      updatedCells,
      updatedColumns: data.length,
      updatedRange: range,
    }));
  }

  /**
   * Calculate hash of row data for change detection
   */
  calculateRowHash(rowData: any[]): string {
    const dataString = JSON.stringify(rowData);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Store sheet configuration in database
   */
  async saveSheetConfiguration(
    spreadsheetId: string,
    sheetName: string,
    syncConfigId?: string
  ): Promise<void> {
    const metadata = await this.getSpreadsheetMetadata(spreadsheetId);
    const sheetInfo = metadata.sheets.find(s => s.title === sheetName);

    await prisma.googleSheet.upsert({
      where: { spreadsheetId },
      update: {
        spreadsheetName: metadata.title,
        sheetName,
        sheetId: sheetInfo?.sheetId,
        lastModified: metadata.lastModifiedTime,
        syncConfigId,
      },
      create: {
        userId: this.userId,
        spreadsheetId,
        spreadsheetName: metadata.title,
        sheetName,
        sheetId: sheetInfo?.sheetId,
        syncConfigId,
      },
    });
  }

  /**
   * Get column letter from index (0 = A, 1 = B, etc.)
   */
  static getColumnLetter(index: number): string {
    let letter = '';
    while (index >= 0) {
      letter = String.fromCharCode((index % 26) + 65) + letter;
      index = Math.floor(index / 26) - 1;
    }
    return letter;
  }

  /**
   * Get column index from letter (A = 0, B = 1, etc.)
   */
  static getColumnIndex(letter: string): number {
    let index = 0;
    for (let i = 0; i < letter.length; i++) {
      index = index * 26 + (letter.charCodeAt(i) - 65) + 1;
    }
    return index - 1;
  }
}