/**
 * @purpose Gestiona el POST para enviar una notificacion de invitación por correo electrónico, valida el payload, aplica limitaciones de velocidad y envía el correo electrónico a través de un servicio.
 * @purpose_en Handles the POST request for sending an invitation email, validates the payload, applies rate limiting, and sends the email using a service.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:5,sig:la1rse
 * @lastUpdated 2026-06-24T10:33:52.776Z
 */

import { NextResponse } from 'next/server';
import { ResendEmailService } from '@/services/email/resend-email-service';
import { rateLimitMongodb } from '@ajabadia/satellite-sdk/utils';
import { z } from 'zod';
import { AuditService } from '@/services/tenant/audit-service';

const InvitePayloadSchema = z.object({
  to: z.string().email(),
  tenantName: z.string().min(1),
  inviteLink: z.string().url(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, tenantName, inviteLink } = InvitePayloadSchema.parse(body);

    // 🚦 Rate limiting: max 10 invites per tenant per hour
    const ip = rateLimitMongodb.getClientIpFromRequest(request);
    const isAllowed = await rateLimitMongodb.check(ip, 'api', 10, 3600);
    if (!isAllowed) {
      return NextResponse.json({ error: 'Demasiadas invitaciones. Intente más tarde.' }, { status: 429 });
    }
    await ResendEmailService.sendInvitationEmail({ to, tenantName, inviteLink });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    await AuditService.logEvent({
      tenantId: 'unknown',
      action: 'INVITE_EMAIL_ERROR',
      entityType: 'USER',
      entityId: 'unknown',
      userId: 'system',
      userEmail: 'system',
      changedFields: { error: error instanceof Error ? error.message : String(error) },
    });
    console.error('Invitation email error:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}
