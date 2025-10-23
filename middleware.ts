import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Allow the request to proceed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Public routes that don't require authentication
        const publicRoutes = ['/login', '/register'];
        const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route));

        // Allow public routes without authentication
        if (isPublicRoute) {
          return true;
        }

        // Require authentication for all other routes
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

// Configure which routes to protect
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
