/**
 * @purpose Gestiona autenticación y middleware internacional para la aplicación ABDtenantGobernance.
 * @purpose_en Manages authentication and internationalization middleware for the ABDtenantGobernance application.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:3,sig:11ojn7g
 * @lastUpdated 2026-06-23T21:52:05.740Z
 */

import { withIndustrialAuth } from '@ajabadia/satellite-sdk/auth-middleware';;
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const proxy = withIndustrialAuth({
  appId: process.env.NEXT_PUBLIC_APP_ID || 'gobernanza',
  clientId: process.env.AUTH_CLIENT_ID as string,
  clientSecret: process.env.AUTH_CLIENT_SECRET || '',
  jwtSecret: process.env.AUTH_JWT_SECRET!,
  publicPaths: ['/', '/logout-success'],
  intlMiddleware,
} as unknown as Parameters<typeof withIndustrialAuth>[0]);

export default proxy;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.svg$).*)'],
};
