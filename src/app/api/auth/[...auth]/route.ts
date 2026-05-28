import { createAuthRouteHandler } from '@ajabadia/satellite-sdk';

const handler = createAuthRouteHandler({
  appId: process.env.NEXT_PUBLIC_APP_ID || 'gobernanza',
  clientId: process.env.AUTH_CLIENT_ID as string,
  clientSecret: process.env.AUTH_CLIENT_SECRET || '',
  jwtSecret: process.env.AUTH_JWT_SECRET || '',
});

export { handler as GET, handler as POST };
