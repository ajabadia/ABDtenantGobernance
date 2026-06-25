/**
 * @purpose Gestiona la generación y emisión de tokens JWT para entornos sandbox, asegurando el acceso industrial y registrando el evento.
 * @purpose_en Handles the generation and issuance of JWT tokens for sandbox environments, ensuring industrial access and logging the event.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:6,sig:533yl1
 * @lastUpdated 2026-06-25T09:23:19.478Z
 */

import { NextResponse } from 'next/server';
import { ensureIndustrialAccess, generateToken } from '@ajabadia/satellite-sdk';
import type { TokenPayloadInput } from '@ajabadia/satellite-sdk/core';;
import { z } from 'zod';
import { AuditService } from '@/services/tenant/audit-service';
import { cookies } from 'next/headers';

const SandboxJwtSchema = z.object({
  sub: z.string().min(1, 'sub es requerido'),
  email: z.string().email('email inválido'),
  name: z.string().optional().default(''),
  surname: z.string().optional().default(''),
  tenantId: z.string().min(1, 'tenantId es requerido'),
  role: z.string().min(1, 'role es requerido'),
  permissions: z.array(z.string()).optional().default([]),
  dbPrefix: z.string().optional().default(''),
  isolationStrategy: z.enum(['COLLECTION_PREFIX', 'DATABASE_PER_TENANT']).optional().default('COLLECTION_PREFIX'),
  allowedApps: z.array(z.string()).optional().default([]),
  groups: z.array(z.string()).optional().default([]),
  sessionId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await ensureIndustrialAccess('SUPER_ADMIN');

    const rawBody = await request.json();
    const body = SandboxJwtSchema.parse(rawBody) as TokenPayloadInput;

    const token = await generateToken(body);

    await AuditService.logEvent({
      tenantId: user.tenantId,
      action: 'SANDBOX_JWT_GENERATED',
      entityType: 'SYSTEM',
      entityId: 'sandbox-jwt',
      userId: user.id,
      userEmail: user.email,
      changedFields: { targetEmail: body.email, targetTenantId: body.tenantId, targetRole: body.role },
    });

    // Set the session cookie to perform instant role shift
    const cookieStore = await cookies();
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

    cookieStore.set('abd_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      domain: cookieDomain,
      maxAge: 7200, // 2 hours
    });

    return NextResponse.json({ token });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid payload', details: JSON.parse(err.message) }, { status: 400 });
    }
    if (err.name === 'UnauthorizedAccessError' || err.name === 'InsufficientPrivilegesError') {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error('[SANDBOX_JWT_ERROR]', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
