/**
 * @purpose Gestiona el envío de correos electrónicos a través de la API Resend, proporcionando métodos de nivel bajo y alto para casos específicos como invitaciones y reinicios de contraseña.
 * @purpose_en Manages sending emails through the Resend API, providing low-level and high-level methods for specific use cases like invitations and password resets.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:5,imports:1,sig:1m6pf63
 * @lastUpdated 2026-06-23T23:28:25.488Z
 */

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

import { ResendEmailService as SDKResendEmailService, type ResendEmailOptions as SDKResendEmailOptions } from '@ajabadia/satellite-sdk';

export interface ResendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/** Low‑level API call delegating to SDK */
export async function sendEmail({ to, subject, html, text }: ResendEmailOptions): Promise<{ id: string }> {
  return SDKResendEmailService.sendEmail({ to, subject, html, text });
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
