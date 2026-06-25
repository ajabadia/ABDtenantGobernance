/**
 * @purpose Gestiona y maneja rutas API para espacios en el sistema de gobernanza del inquilino, incluyendo la recuperación de jerarquías de espacio y la creación de nuevos espacios.
 * @purpose_en Manages and handles API routes for spaces in the tenant governance system, including retrieving space hierarchies and creating new spaces.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:5,sig:rf6puc
 * @lastUpdated 2026-06-24T10:33:28.567Z
 */

import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { SpaceService, SpaceAccessService } from '@/services/tenant/space-service';
import { connectDB, withTenantContext } from '@ajabadia/satellite-sdk/db';
import { AuditService } from '@/services/tenant/audit-service';

/**
 * 🗂️ GET /api/admin/spaces
 * Returns the spaces hierarchy for a tenant.
 */
export async function GET(request: Request) {
  return withTenantContext(async () => {
    try {
      const user = await ensureIndustrialAccess('ADMIN');
      await connectDB();
      
      const { searchParams } = new URL(request.url);
      const tenantId = searchParams.get('tenantId') || user.tenantId;
      const parentSpaceId = searchParams.get('parentSpaceId');
      const isRoot = searchParams.get('isRoot') === 'true';
      
      const spaces = await SpaceAccessService.getAccessibleSpaces(tenantId, user.id, {
        parentSpaceId: parentSpaceId || undefined,
        isRoot: isRoot || undefined
      });
      
      return NextResponse.json(spaces);
    } catch (error: unknown) {
      const err = error as Error;
      await AuditService.logEvent({
        tenantId: 'unknown',
        action: 'SPACE_LIST_ERROR',
        entityType: 'SPACE',
        entityId: 'unknown',
        userId: 'system',
        userEmail: 'system',
        changedFields: { error: err.message || 'Unknown error' },
      });
      console.error('[API_GET_SPACES_ERROR]', error);
      const status = err.message === 'UNAUTHORIZED_ECOSYSTEM_ACCESS' ? 403 : 500;
      return NextResponse.json({ error: err.message || 'Unauthorized' }, { status });
    }
  });
}

/**
 * 🗂️ POST /api/admin/spaces
 * Creates a new space in the hierarchy.
 */
export async function POST(request: Request) {
  return withTenantContext(async () => {
    try {
      const user = await ensureIndustrialAccess('ADMIN');
      await connectDB();
      
      const body = await request.json();
      const tenantId = body.tenantId || user.tenantId;
      
      const newSpace = await SpaceService.createSpace(tenantId, user.id, body, user.email);
      
      return NextResponse.json(newSpace, { status: 201 });
    } catch (error: unknown) {
      const err = error as Error;
      await AuditService.logEvent({
        tenantId: 'unknown',
        action: 'SPACE_CREATE_ERROR',
        entityType: 'SPACE',
        entityId: 'unknown',
        userId: 'system',
        userEmail: 'system',
        changedFields: { error: err.message || 'Unknown error' },
      });
      console.error('[API_POST_SPACES_ERROR]', error);
      return NextResponse.json({ error: err.message || 'Invalid space data' }, { status: 400 });
    }
  });
}
