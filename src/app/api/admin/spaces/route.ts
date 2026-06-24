/**
 * @purpose Gestiona y maneja rutas API para espacios en el sistema de gobernanza del inquilino, incluyendo la recuperación de jerarquías de espacio y la creación de nuevos espacios.
 * @purpose_en Manages and handles API routes for spaces in the tenant governance system, including retrieving space hierarchies and creating new spaces.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:5,sig:1bl5ixq
 * @lastUpdated 2026-06-23T23:27:16.296Z
 */

import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk';
import { SpaceService, SpaceAccessService } from '@/services/tenant/space-service';
import { connectDB } from '@ajabadia/satellite-sdk';
import { withTenantContext } from '@ajabadia/satellite-sdk';

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
      console.error('[API_GET_SPACES_ERROR]', error);
      const err = error as Error;
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
      console.error('[API_POST_SPACES_ERROR]', error);
      const err = error as Error;
      return NextResponse.json({ error: err.message || 'Invalid space data' }, { status: 400 });
    }
  });
}
