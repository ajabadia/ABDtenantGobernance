import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk';
import { TenantService } from '@/services/tenant/tenant-service';
import { connectDB } from '@ajabadia/satellite-sdk';
import { TenantSchema } from '@/lib/schemas/tenant';

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
    console.error('[API_GET_TENANTS_ERROR]', error);
    const err = error as Error;
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
    console.error('[API_POST_TENANTS_ERROR]', error);
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Invalid tenant data' }, { status: 400 });
  }
}
