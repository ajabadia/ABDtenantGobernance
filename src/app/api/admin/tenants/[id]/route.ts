/**
 * @purpose Gestiona solicitudes PATCH y DELETE para actualizar y desactivar información de un inquilino.
 * @purpose_en Manages PATCH and DELETE requests to update and deactivate a tenant's information.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:6,sig:pjea8d
 * @lastUpdated 2026-06-24T10:33:46.032Z
 */

import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { TenantService } from '@/services/tenant/tenant-service';
import { TenantRepository } from '@/lib/repositories/TenantRepository';
import { connectDB } from '@ajabadia/satellite-sdk/db';
import { AuditService } from '@/services/tenant/audit-service';

const tenantRepository = new TenantRepository();

/**
 * 🏢 PATCH /api/admin/tenants/[id]
 * Updates a tenant's information by Mongoose _id.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await ensureIndustrialAccess('ADMIN');
    await connectDB();
    
    const { id } = await params;
    
    // 1. Resolve tenant document to get its unique tenantId string
    const tenantDoc = await tenantRepository.findById(id);
    if (!tenantDoc) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }
    
    const body = await request.json();
    
    // 2. Perform the update via the Service layer to ensure encryption and cache purges
    const updatedTenant = await TenantService.updateConfig(tenantDoc.tenantId, body, user.email);
    
    return NextResponse.json(updatedTenant);
  } catch (error: unknown) {
    const err = error as Error;
    await AuditService.logEvent({
      tenantId: 'unknown',
      action: 'TENANT_UPDATE_ERROR',
      entityType: 'TENANT',
      entityId: 'unknown',
      userId: 'system',
      userEmail: 'system',
      changedFields: { error: err.message || 'Unknown error' },
    });
    console.error('[API_PATCH_TENANT_ERROR]', error);
    return NextResponse.json({ error: err.message || 'Invalid data' }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(_request.url);
    const purge = searchParams.get('purge') === 'true';

    let user;
    if (purge) {
      user = await ensureIndustrialAccess('SUPER_ADMIN');
    } else {
      user = await ensureIndustrialAccess('ADMIN');
    }

    await connectDB();
    const { id } = await params;

    if (purge) {
      await TenantService.purgeTenant(id, user.email);
      return NextResponse.json({ message: 'Tenant purged successfully (GDPR cascaded)' });
    } else {
      await TenantService.deleteTenant(id, user.email);
      return NextResponse.json({ message: 'Tenant deactivated successfully' });
    }
  } catch (error: unknown) {
    const err = error as Error;
    await AuditService.logEvent({
      tenantId: 'unknown',
      action: 'TENANT_DELETE_ERROR',
      entityType: 'TENANT',
      entityId: 'unknown',
      userId: 'system',
      userEmail: 'system',
      changedFields: { error: err.message || 'Unknown error' },
    });
    console.error('[API_DELETE_TENANT_ERROR]', error);
    return NextResponse.json({ error: err.message || 'Error deactivating/purging tenant' }, { status: 400 });
  }
}
