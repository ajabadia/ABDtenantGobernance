/**
 * @purpose Gestiona y maneja rutas API para operaciones de inquilinos, incluyendo la lista y creación de nuevos inquilinos.
 * @purpose_en Manages and handles API routes for tenant operations, including listing and creating new tenants.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:6,sig:tyglyi
 * @lastUpdated 2026-06-24T10:33:41.402Z
 */

import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { TenantService } from '@/services/tenant/tenant-service';
import { connectDB } from '@ajabadia/satellite-sdk/db';
import { TenantSchema } from '@/lib/schemas/tenant';
import { AuditService } from '@/services/tenant/audit-service';

// ... (GET handler unchanged, doing a precise chunk below)

/**
 * 🏢 GET /api/admin/tenants
 * Lists all tenants in the system. Guarded by ecosystem session role.
 */
export async function GET() {
  try {
    const user = await ensureIndustrialAccess('ADMIN');
    await connectDB();
    
    const tenants = await TenantService.getAllTenants();
    return NextResponse.json(tenants);
  } catch (error: unknown) {
    const err = error as Error;
    await AuditService.logEvent({
      tenantId: 'unknown',
      action: 'TENANT_LIST_ERROR',
      entityType: 'TENANT',
      entityId: 'unknown',
      userId: 'system',
      userEmail: 'system',
      changedFields: { error: err.message || 'Unknown error' },
    });
    console.error('[API_GET_TENANTS_ERROR]', error);
    const message = err.message || 'Unauthorized';
    const status = message === 'UNAUTHORIZED_ECOSYSTEM_ACCESS' || message === 'INSUFFICIENT_INDUSTRIAL_PRIVILEGES' ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * 🏢 POST /api/admin/tenants
 * Creates a new tenant organization.
 */
export async function POST(request: Request) {
  try {
    const user = await ensureIndustrialAccess('ADMIN');
    await connectDB();
    
    const rawBody = await request.json();
    const body = TenantSchema.parse(rawBody);
    const newTenant = await TenantService.createTenant(body, user.email);
    
    return NextResponse.json(newTenant, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    await AuditService.logEvent({
      tenantId: 'unknown',
      action: 'TENANT_CREATE_ERROR',
      entityType: 'TENANT',
      entityId: 'unknown',
      userId: 'system',
      userEmail: 'system',
      changedFields: { error: err.message || 'Unknown error' },
    });
    console.error('[API_POST_TENANTS_ERROR]', error);
    return NextResponse.json({ error: err.message || 'Invalid tenant data' }, { status: 400 });
  }
}
