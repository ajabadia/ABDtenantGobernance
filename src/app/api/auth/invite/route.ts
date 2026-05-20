import { NextResponse } from 'next/server';
import { ResendEmailService } from '@/services/email/resend-email-service';

export async function POST(request: Request) {
  const { to, tenantName, inviteLink } = await request.json();
  try {
    await ResendEmailService.sendInvitationEmail({ to, tenantName, inviteLink });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Invitation email error:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}
