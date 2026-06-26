/**
 * @purpose Gestiona rutas de autenticación para la aplicación ABDtenantGobernance utilizando la biblioteca Satellite SDK.
 * @purpose_en Manages authentication routes for the ABDtenantGobernance application using the Satellite SDK.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:2,sig:ja02nq
 * @lastUpdated 2026-06-26T15:32:32.004Z
 */

import type { NextRequest, NextResponse } from 'next/server';
import { createAuthRouteHandler } from '@ajabadia/satellite-sdk/auth-middleware';

/**
 * Catch-All SSO Auth Route Handler
 * Manages /api/abd-auth/session, /api/abd-auth/logout, and /api/abd-auth/federated/callback dynamically.
 * NOTE: Vercel reserves /api/auth/* — this route uses /api/abd-auth/* to avoid platform shadowing.
 */
const sdkHandler = createAuthRouteHandler({
  appId: process.env.NEXT_PUBLIC_APP_ID || 'gobernanza',
  clientId: process.env.AUTH_CLIENT_ID as string,
  clientSecret: process.env.AUTH_CLIENT_SECRET || '',
  jwtSecret: process.env.AUTH_JWT_SECRET || 'build-time-placeholder-secret',
});

// pnpm aísla las instalaciones de next en el .pnpm store para cada paquete,
// haciendo que NextRequest/NextResponse branded types sean incompatibles
// entre el SDK y el consumer aunque sean la misma versión (16.2.6).
// El cast via unknown rompe el puente de tipos branded de forma segura.
type AppRouteHandler = (request: NextRequest) => NextResponse | Promise<NextResponse>;
export const GET = sdkHandler as unknown as AppRouteHandler;
export const POST = sdkHandler as unknown as AppRouteHandler;
