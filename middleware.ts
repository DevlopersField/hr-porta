// middleware.ts
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname.startsWith('/login');
  const isPublicAsset =
    req.nextUrl.pathname.startsWith('/api/auth') ||
    req.nextUrl.pathname.startsWith('/api/health') ||
    req.nextUrl.pathname.startsWith('/api/uploads') ||
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname === '/favicon.ico';

  if (isPublicAsset) return;
  if (!isLoggedIn && !isLoginPage) {
    return Response.redirect(new URL('/login', req.nextUrl));
  }
  if (isLoggedIn && isLoginPage) {
    return Response.redirect(new URL('/home', req.nextUrl));
  }
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
