import { NextResponse } from 'next/server';
import { ResendEmailService } from '@/services/email/resend-email-service';

export async function POST(request: Request) {
  const { to, resetLink } = await request.json();
  try {
    await ResendEmailService.sendPasswordResetEmail({ to, resetLink });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Password reset email error:', error);
    return NextResponse.json({ error: 'Failed to send password reset email' }, { status: 500 });
  }
}
