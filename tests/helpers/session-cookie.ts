/**
 * 🔐 Session Cookie Helper — Generates a valid `abd_session` JWT cookie
 *
 * Gobernance's proxy middleware checks for the `abd_session` cookie (a JWT
 * signed with AUTH_JWT_SECRET). This helper creates a valid token so E2E tests
 * can bypass the OAuth federated login flow and navigate directly to admin pages.
 *
 * The shared secret between ABDAuth and Gobernance is read from
 * process.env.AUTH_JWT_SECRET, with fallback `abd-auth-industrial-fallback-secret-2026`.
 *
 * If the IDP (ABDAuth) is unreachable for session expiry verification, the SDK
 * falls back to the "24h rule" — as long as `iat` is within 24 hours, the
 * session is considered valid.
 *
 * ⚠️  Uses jose.SignJWT (not raw crypto.createHmac) to guarantee compatibility
 *     with the SDK's jwtVerify() which uses jose.jwtVerify().
 */

import { SignJWT } from 'jose';

const JWT_SECRET: string =
  process.env.AUTH_JWT_SECRET ||
  'abd-auth-industrial-fallback-secret-2026';

export interface SessionCookiePayload {
  sub: string;
  email: string;
  name: string;
  surname: string;
  role: string;
  tenantId: string;
  permissions: string[];
  dbPrefix: string;
  isolationStrategy: string;
  allowedApps?: string[];
  sessionId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Create a signed JWT token for the `abd_session` cookie.
 * The token is signed with HS256 using jose (matching the SDK's jwtVerify).
 */
export async function createSessionToken(overrides?: Partial<SessionCookiePayload>): Promise<string> {
  const secretKey = new TextEncoder().encode(JWT_SECRET);

  const payload = {
    sub: 'e2e-test-user',
    email: 'ajabadia@gmail.com',
    name: 'E2E',
    surname: 'Test',
    role: 'SUPER_ADMIN',
    tenantId: 'default',
    permissions: ['*'],
    dbPrefix: 'abd',
    isolationStrategy: 'COLLECTION_PREFIX',
    allowedApps: ['gobernanza'],
    sessionId: `e2e-session-${Math.floor(Date.now() / 1000)}`,
    ...overrides,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secretKey);

  return token;
}

/**
 * Get cookie key/value pairs to set via Playwright's context.addCookies().
 * This sets both the session cookie and a fresh verified cookie to skip the
 * session expiry verification call to ABDAuth.
 *
 * Note: This is async because createSessionToken uses jose.SignJWT.
 */
export async function getSessionCookies(options?: {
  domain?: string;
  path?: string;
  payloadOverrides?: Partial<SessionCookiePayload>;
}): Promise<{ name: string; value: string; domain: string; path: string; httpOnly?: boolean; expires?: number }[]> {
  const domain = options?.domain || 'localhost';
  const path = options?.path || '/';

  const token = await createSessionToken(options?.payloadOverrides);

  return [
    {
      name: 'abd_session',
      value: token,
      domain,
      path,
      httpOnly: true,
    },
    // Setting abd_session_verified=1 avoids the verifySessionExpiry call
    // (the middleware only calls it when this cookie is absent)
    {
      name: 'abd_session_verified',
      value: '1',
      domain,
      path,
      httpOnly: true,
      expires: Math.floor(Date.now() / 1000) + 120, // 2 min
    },
  ];
}
