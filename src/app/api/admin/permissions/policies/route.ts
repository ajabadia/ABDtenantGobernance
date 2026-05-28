import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk';
import { PermissionService } from '@/services/tenant/permission-service';
import { PermissionPolicyRepository } from '@/lib/repositories/PermissionPolicyRepository';
import { connectDB } from '@ajabadia/satellite-sdk';
import { withTenantContext } from '@ajabadia/satellite-sdk';

const policyRepository = new PermissionPolicyRepository();

export async function GET(request: Request) {
  return withTenantContext(async () => {
    try {
      const user = await ensureIndustrialAccess('ADMIN');
      await connectDB();

      const { searchParams } = new URL(request.url);
      const tenantId = searchParams.get('tenantId') || user.tenantId;

      const policies = await policyRepository.find({ tenantId });
      
      // Normalize string IDs
      const normalized = policies.map(p => {
        const obj = p.toObject();
        return {
          ...obj,
          _id: obj._id.toString()
        };
      });

      return NextResponse.json({ data: normalized });
    } catch (error: unknown) {
      console.error('[API_GET_POLICIES_ERROR]', error);
      const err = error as Error;
      const status = err.message === 'UNAUTHORIZED_ECOSYSTEM_ACCESS' ? 403 : 500;
      return NextResponse.json({ error: err.message || 'Unauthorized' }, { status });
    }
  });
}

export async function POST(request: Request) {
  return withTenantContext(async () => {
    try {
      const user = await ensureIndustrialAccess('ADMIN');
      await connectDB();

      const body = await request.json();
      const tenantId = body.tenantId || user.tenantId;

      const newPolicy = await PermissionService.createPolicy(tenantId, user.id, body, user.email);

      return NextResponse.json({ data: newPolicy }, { status: 201 });
    } catch (error: unknown) {
      console.error('[API_POST_POLICIES_ERROR]', error);
      const err = error as Error;
      return NextResponse.json({ error: err.message || 'Invalid policy data' }, { status: 400 });
    }
  });
}
