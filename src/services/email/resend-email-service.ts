// src/services/email/resend-email-service.ts

/**
 * Simple wrapper around Resend's email API.
 * Reads the API key and default "from" address from environment variables:
 *   RESEND_API_KEY   – your Resend secret key
 *   RESEND_FROM_EMAIL – "Name <email@domain>"
 *
 * The service provides a low‑level `sendEmail` method and higher‑level helpers
 * for the two use‑cases we need (invitation and password‑reset). All calls are
 * async and throw on non‑2xx responses so that callers can handle failures.
 */

export interface ResendEmailOptions {
  to: string;
  subject: string;
  html: string; // HTML body
  // plain text fallback – optional but recommended for email clients
  text?: string;
}

/** Low‑level API call */
export async function sendEmail({ to, subject, html, text }: ResendEmailOptions) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not defined in environment');
  }
  if (!from) {
    throw new Error('RESEND_FROM_EMAIL is not defined in environment');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      ...(text ? { text } : {}),
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    // Resend returns `{ error: { message: string } }` on failure
    const errMsg = data?.error?.message ?? response.statusText;
    throw new Error(`Resend email failed: ${errMsg}`);
  }
  return data;
}

/** Helper for invitation emails */
export async function sendInvitationEmail({ to, tenantName, inviteLink }: { to: string; tenantName: string; inviteLink: string }) {
  const subject = `Invitación a unirse a ${tenantName}`;
  const html = `
    <p>Hola,</p>
    <p>Has sido invitado a unirte a <strong>${tenantName}</strong> en la plataforma ABD RAG.</p>
    <p>Haz clic en el siguiente enlace para completar tu registro:</p>
    <p><a href="${inviteLink}">${inviteLink}</a></p>
    <p>Si no esperabas este correo, puedes ignorarlo.</p>
    <p>Saludos,</p>
    <p>Equipo ABD RAG</p>
  `;
  return sendEmail({ to, subject, html });
}

/** Helper for password‑reset emails */
export async function sendPasswordResetEmail({ to, resetLink }: { to: string; resetLink: string }) {
  const subject = 'Restablece tu contraseña en ABD RAG';
  const html = `
    <p>Hola,</p>
    <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
    <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
    <p><a href="${resetLink}">${resetLink}</a></p>
    <p>Si no solicitaste este cambio, por favor ignora este mensaje.</p>
    <p>Saludos,</p>
    <p>Equipo ABD RAG</p>
  `;
  return sendEmail({ to, subject, html });
}

// Export a default object for convenient import
export const ResendEmailService = {
  sendEmail,
  sendInvitationEmail,
  sendPasswordResetEmail,
};
