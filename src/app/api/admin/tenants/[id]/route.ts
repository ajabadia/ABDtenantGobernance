import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk';
import { TenantService } from '@/services/tenant/tenant-service';
import { TenantRepository } from '@/lib/repositories/TenantRepository';
import { connectDB } from '@ajabadia/satellite-sdk';

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
    console.error('[API_PATCH_TENANT_ERROR]', error);
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Invalid data' }, { status: 400 });
  }
}

/**
 * 🏢 DELETE /api/admin/tenants/[id]
 * Deactivates a tenant by Mongoose _id (logical soft-delete).
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await ensureIndustrialAccess('ADMIN');
    await connectDB();
    
    const { id } = await params;
    await TenantService.deleteTenant(id, user.email);
    
    return NextResponse.json({ message: 'Tenant deactivated successfully' });
  } catch (error: unknown) {
    console.error('[API_DELETE_TENANT_ERROR]', error);
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Error deactivating tenant' }, { status: 400 });
  }
}
