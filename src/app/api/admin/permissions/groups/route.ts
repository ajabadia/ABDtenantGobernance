import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk';
import { PermissionService } from '@/services/tenant/permission-service';
import { PermissionGroupRepository } from '@/lib/repositories/PermissionGroupRepository';
import { connectDB } from '@ajabadia/satellite-sdk';
import { withTenantContext } from '@ajabadia/satellite-sdk';

const groupRepository = new PermissionGroupRepository();

export async function GET(request: Request) {
  return withTenantContext(async () => {
    try {
      const user = await ensureIndustrialAccess('ADMIN');
      await connectDB();

      const { searchParams } = new URL(request.url);
      const tenantId = searchParams.get('tenantId') || user.tenantId;

      const groups = await groupRepository.find({ tenantId });
      
      // Normalize string IDs
      const normalized = groups.map(g => {
        const obj = g.toObject();
        return {
          ...obj,
          _id: obj._id.toString(),
          parentId: obj.parentId ? obj.parentId.toString() : null,
          policyIds: obj.policyIds ? obj.policyIds.map((id: unknown) => String(id)) : []
        };
      });

      return NextResponse.json({ data: normalized });
    } catch (error: unknown) {
      console.error('[API_GET_GROUPS_ERROR]', error);
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

      const newGroup = await PermissionService.createGroup(tenantId, user.id, body, user.email);

      return NextResponse.json({ data: newGroup }, { status: 201 });
    } catch (error: unknown) {
      console.error('[API_POST_GROUPS_ERROR]', error);
      const err = error as Error;
      return NextResponse.json({ error: err.message || 'Invalid group data' }, { status: 400 });
    }
  });
}
