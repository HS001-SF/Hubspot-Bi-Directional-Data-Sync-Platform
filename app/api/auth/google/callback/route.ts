import { NextRequest, NextResponse } from 'next/server';
import { googleAuth } from '@/lib/googlesheets/auth';

/**
 * Handle Google OAuth callback
 * GET /api/auth/google/callback?code=xxx&state=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings?error=missing_parameters', request.url)
      );
    }

    // Decode state to get user ID
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      return NextResponse.redirect(
        new URL('/settings?error=invalid_state', request.url)
      );
    }

    const { userId } = stateData;

    if (!userId) {
      return NextResponse.redirect(
        new URL('/settings?error=invalid_state', request.url)
      );
    }

    // Exchange code for tokens
    await googleAuth.exchangeCodeForTokens(code, userId);

    // Redirect to settings with success message
    return NextResponse.redirect(
      new URL('/settings?success=google_connected', request.url)
    );
  } catch (error: any) {
    console.error('Error handling Google OAuth callback:', error);
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}
