import { withIndustrialAuth } from '@abd/satellite-sdk';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export const proxy = withIndustrialAuth({
  appId: process.env.NEXT_PUBLIC_APP_ID || 'gobernanza',
  clientId: process.env.AUTH_CLIENT_ID || 'abdgov-industrial-client-id',
  clientSecret: process.env.AUTH_CLIENT_SECRET || '',
  jwtSecret: process.env.AUTH_JWT_SECRET || '',
  publicPaths: ['/', '/logout-success'],
  intlMiddleware,
});

export const config = {
  // Intercept all routes except api, static resources, and images
  matcher: ['/((?!api|_next/static|_next/image|.*\\.svg$).*)'],
};
