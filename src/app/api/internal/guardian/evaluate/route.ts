import { NextResponse } from 'next/server';
import { GuardianEngine } from '@/services/guardian/guardian-engine';
import connectDB from '@/lib/database/mongodb';
import { withTenantContext } from '@/lib/database/tenant-model';

export async function POST(req: Request) {
  return withTenantContext(async () => {
    try {
      const authHeader = req.headers.get('x-abd-internal-secret');
      const internalSecret = process.env.ABD_INTERNAL_SECRET;

      if (!internalSecret || authHeader !== internalSecret) {
        return NextResponse.json({ error: 'Unauthorized S2S' }, { status: 401 });
      }

      const body = await req.json();
      const { tenantId, userId, resource, action, context } = body;

      if (!tenantId || !userId || !resource || !action) {
        return NextResponse.json(
          { error: 'Missing required fields: tenantId, userId, resource, action' },
          { status: 400 }
        );
      }

      await connectDB();

      const result = await GuardianEngine.evaluate({
        tenantId,
        userId,
        resource,
        action,
        context,
      });

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      console.error('[GuardianEngine S2S] Error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  });
}
