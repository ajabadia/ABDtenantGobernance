/**
 * @purpose Gestiona el solicitud POST para enviar un correo electrónico de reinicio de contraseña, incluyendo la limitación de velocidad.
 * @purpose_en Handles the POST request for sending a password reset email, including rate limiting.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:4,sig:1m3aoyu
 * @lastUpdated 2026-06-24T10:33:57.894Z
 */

import { NextResponse } from 'next/server';
import { ResendEmailService } from '@/services/email/resend-email-service';
import { rateLimitMongodb } from '@ajabadia/satellite-sdk/utils';
import { AuditService } from '@/services/tenant/audit-service';

export async function POST(request: Request) {
  const { to, resetLink } = await request.json();

  // 🚦 Rate limiting: max 5 reset requests per email per hour
  const ip = rateLimitMongodb.getClientIpFromRequest(request);
  const isAllowed = await rateLimitMongodb.check(to || ip, 'recovery', 5, 3600);
  if (!isAllowed) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Intente más tarde.' }, { status: 429 });
  }
  try {
    await ResendEmailService.sendPasswordResetEmail({ to, resetLink });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    await AuditService.logEvent({
      tenantId: 'unknown',
      action: 'PASSWORD_RESET_EMAIL_ERROR',
      entityType: 'USER',
      entityId: to || 'unknown',
      userId: 'system',
      userEmail: 'system',
      changedFields: { error: error instanceof Error ? error.message : String(error) },
    });
    console.error('Password reset email error:', error);
    return NextResponse.json({ error: 'Failed to send password reset email' }, { status: 500 });
  }
}
