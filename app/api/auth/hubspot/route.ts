import { NextRequest, NextResponse } from 'next/server';
import { hubspotAuth } from '@/lib/hubspot/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
 * Initiate HubSpot OAuth flow
 * GET /api/auth/hubspot
 */
export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate state parameter for CSRF protection
    const state = Buffer.from(
      JSON.stringify({
        userId: (session.user as any).id,
        timestamp: Date.now(),
      })
    ).toString('base64');

    // Get authorization URL
    const authUrl = hubspotAuth.getAuthorizationUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('Error initiating HubSpot OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}
