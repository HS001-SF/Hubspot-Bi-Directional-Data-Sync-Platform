import { NextRequest, NextResponse } from 'next/server';
import { googleAuth } from '@/lib/googlesheets/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
 * Initiate Google OAuth flow
 * GET /api/auth/google
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
    const authUrl = googleAuth.getAuthorizationUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('Error initiating Google OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}
