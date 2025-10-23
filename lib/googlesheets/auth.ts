/**
 * Google OAuth Authentication Module
 * Handles OAuth2 flow for Google Sheets API access
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@/lib/prisma';

export class GoogleSheetsAuth {
  private oauth2Client: OAuth2Client;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID!;
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    this.redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

    this.oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );
  }

  /**
   * Get the authorization URL for OAuth consent
   */
  getAuthorizationUrl(state: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state,
      prompt: 'consent', // Force consent to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string, userId: string) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);

      // Set credentials to get user info
      this.oauth2Client.setCredentials(tokens);

      // Get user info
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const userInfo = await oauth2.userinfo.get();

      // Calculate token expiry
      const tokenExpiry = tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : new Date(Date.now() + 3600 * 1000); // Default 1 hour

      // Save or update account in database
      // First, find existing account
      const existingAccount = await prisma.account.findFirst({
        where: { userId },
      });

      let account;
      if (existingAccount) {
        // Update existing account
        account = await prisma.account.update({
          where: { id: existingAccount.id },
          data: {
            googleAccountId: userInfo.data.id,
            googleAccessToken: tokens.access_token,
            googleRefreshToken: tokens.refresh_token,
            googleTokenExpiry: tokenExpiry,
            googleEmail: userInfo.data.email,
          },
        });
      } else {
        // Create new account
        account = await prisma.account.create({
          data: {
            userId,
            googleAccountId: userInfo.data.id,
            googleAccessToken: tokens.access_token,
            googleRefreshToken: tokens.refresh_token,
            googleTokenExpiry: tokenExpiry,
            googleEmail: userInfo.data.email,
          },
        });
      }

      return {
        account,
        userInfo: userInfo.data,
      };
    } catch (error: any) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error(`Failed to connect Google account: ${error.message}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(userId: string): Promise<string> {
    const account = await prisma.account.findFirst({
      where: { userId },
    });

    if (!account?.googleRefreshToken) {
      throw new Error('No Google refresh token available');
    }

    try {
      this.oauth2Client.setCredentials({
        refresh_token: account.googleRefreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      const tokenExpiry = credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : new Date(Date.now() + 3600 * 1000);

      // Update tokens in database
      await prisma.account.update({
        where: { id: account.id },
        data: {
          googleAccessToken: credentials.access_token,
          googleTokenExpiry: tokenExpiry,
        },
      });

      return credentials.access_token!;
    } catch (error: any) {
      console.error('Error refreshing Google token:', error);
      throw new Error(`Failed to refresh Google token: ${error.message}`);
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(userId: string): Promise<string> {
    const account = await prisma.account.findFirst({
      where: { userId },
    });

    if (!account) {
      throw new Error('No Google account connected');
    }

    if (!account.googleAccessToken) {
      throw new Error('No Google access token available');
    }

    // Check if token is expired or about to expire
    const now = new Date();
    const tokenExpiry = account.googleTokenExpiry;

    if (!tokenExpiry || tokenExpiry <= new Date(now.getTime() + 5 * 60 * 1000)) {
      // Token expired or expires in less than 5 minutes
      return await this.refreshAccessToken(userId);
    }

    return account.googleAccessToken;
  }

  /**
   * Get authenticated Google Sheets client
   */
  async getAuthenticatedClient(userId: string) {
    const accessToken = await this.getValidAccessToken(userId);

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    return google.sheets({ version: 'v4', auth });
  }

  /**
   * Get authenticated Google Drive client
   */
  async getAuthenticatedDriveClient(userId: string) {
    const accessToken = await this.getValidAccessToken(userId);

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    return google.drive({ version: 'v3', auth });
  }

  /**
   * Revoke Google access
   */
  async revokeAccess(userId: string): Promise<boolean> {
    const account = await prisma.account.findFirst({
      where: { userId },
    });

    if (!account?.googleAccessToken) {
      return false;
    }

    try {
      await this.oauth2Client.revokeToken(account.googleAccessToken);

      // Clear Google tokens from database
      await prisma.account.update({
        where: { id: account.id },
        data: {
          googleAccountId: null,
          googleAccessToken: null,
          googleRefreshToken: null,
          googleTokenExpiry: null,
          googleEmail: null,
        },
      });

      return true;
    } catch (error) {
      console.error('Error revoking Google access:', error);
      return false;
    }
  }

  /**
   * Check if user has Google account connected
   */
  async isConnected(userId: string): Promise<boolean> {
    const account = await prisma.account.findFirst({
      where: { userId },
      select: { googleAccountId: true },
    });

    return !!account?.googleAccountId;
  }
}

export const googleAuth = new GoogleSheetsAuth();