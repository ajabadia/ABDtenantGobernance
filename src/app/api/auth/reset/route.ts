import { NextResponse } from 'next/server';
import { ResendEmailService } from '@/services/email/resend-email-service';
import { rateLimitMongodb } from '@ajabadia/satellite-sdk';

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
    console.error('Password reset email error:', error);
    return NextResponse.json({ error: 'Failed to send password reset email' }, { status: 500 });
  }
}
