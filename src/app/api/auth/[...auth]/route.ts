import type { NextRequest, NextResponse } from 'next/server';
import { createAuthRouteHandler } from '@ajabadia/satellite-sdk';

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

