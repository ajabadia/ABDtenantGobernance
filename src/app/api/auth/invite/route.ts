import { NextResponse } from 'next/server';
import { ResendEmailService } from '@/services/email/resend-email-service';
import { z } from 'zod';

const InvitePayloadSchema = z.object({
  to: z.string().email(),
  tenantName: z.string().min(1),
  inviteLink: z.string().url(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, tenantName, inviteLink } = InvitePayloadSchema.parse(body);
    await ResendEmailService.sendInvitationEmail({ to, tenantName, inviteLink });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Invitation email error:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}
