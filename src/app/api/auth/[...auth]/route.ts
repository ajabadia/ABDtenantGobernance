/**
 * @purpose Gestiona rutas de autenticación para la aplicación ABDtenantGobernance utilizando la biblioteca Satellite SDK.
 * @purpose_en Handles authentication routes for the ABDtenantGobernance application using the Satellite SDK.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:2,sig:1jut9dq
 * @lastUpdated 2026-06-23T20:36:36.599Z
 */

import type { NextRequest, NextResponse } from 'next/server';
import { createAuthRouteHandler } from '@ajabadia/satellite-sdk/auth-middleware';

const sdkHandler = createAuthRouteHandler({
  appId: process.env.NEXT_PUBLIC_APP_ID || 'gobernanza',
  clientId: process.env.AUTH_CLIENT_ID as string,
  clientSecret: process.env.AUTH_CLIENT_SECRET || '',
  jwtSecret: process.env.AUTH_JWT_SECRET!,
});

// pnpm aísla las instalaciones de next en el .pnpm store para cada paquete,
// haciendo que NextRequest/NextResponse branded types sean incompatibles
// entre el SDK y el consumer aunque sean la misma versión (16.2.6).
// El cast via unknown rompe el puente de tipos branded de forma segura.
type AppRouteHandler = (request: NextRequest) => NextResponse | Promise<NextResponse>;
export const GET = sdkHandler as unknown as AppRouteHandler;
export const POST = sdkHandler as unknown as AppRouteHandler;

