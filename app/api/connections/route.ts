import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { hubspotAuth } from '@/lib/hubspot/auth';
import { googleAuth } from '@/lib/googlesheets/auth';

/**
 * Get connection status for all integrations
 * GET /api/connections
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    // Get account information
    const account = await prisma.account.findFirst({
      where: { userId },
      select: {
        hubspotAccountId: true,
        portalId: true,
        tokenExpiry: true,
        googleAccountId: true,
        googleEmail: true,
        googleTokenExpiry: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const response = {
      hubspot: {
        connected: !!account?.hubspotAccountId,
        portalId: account?.portalId || null,
        connectedAt: account?.createdAt || null,
        tokenExpiry: account?.tokenExpiry || null,
      },
      google: {
        connected: !!account?.googleAccountId,
        email: account?.googleEmail || null,
        connectedAt: account?.updatedAt || null,
        tokenExpiry: account?.googleTokenExpiry || null,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching connection status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connection status' },
      { status: 500 }
    );
  }
}

/**
 * Refresh access tokens
 * POST /api/connections
 * Body: { provider: 'hubspot' | 'google' }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { provider } = body;

    if (!provider || !['hubspot', 'google'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be "hubspot" or "google"' },
        { status: 400 }
      );
    }

    let newToken;

    if (provider === 'hubspot') {
      newToken = await hubspotAuth.refreshAccessToken(userId);
    } else if (provider === 'google') {
      newToken = await googleAuth.refreshAccessToken(userId);
    }

    return NextResponse.json({
      success: true,
      message: `${provider} token refreshed successfully`,
    });
  } catch (error: any) {
    console.error('Error refreshing token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to refresh token' },
      { status: 500 }
    );
  }
}

/**
 * Disconnect integration
 * DELETE /api/connections
 * Body: { provider: 'hubspot' | 'google' }
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { provider } = body;

    if (!provider || !['hubspot', 'google'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be "hubspot" or "google"' },
        { status: 400 }
      );
    }

    let success;

    if (provider === 'hubspot') {
      success = await hubspotAuth.revokeAccess(userId);
    } else if (provider === 'google') {
      success = await googleAuth.revokeAccess(userId);
    }

    if (success) {
      return NextResponse.json({
        success: true,
        message: `${provider} disconnected successfully`,
      });
    } else {
      throw new Error(`Failed to disconnect ${provider}`);
    }
  } catch (error: any) {
    console.error('Error disconnecting:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect' },
      { status: 500 }
    );
  }
}
