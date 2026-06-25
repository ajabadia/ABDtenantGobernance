/**
 * @purpose Gestiona el solicitud GET para obtener los registros de auditoría combinados SaaS para un inquilino, asegurando acceso industrial y conectándose a la base de datos.
 * @purpose_en Manages the GET request to retrieve combined SaaS audit logs for a tenant, ensuring industrial access and connecting to the database.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:4,sig:romm2f
 * @lastUpdated 2026-06-24T10:33:02.873Z
 */

import { NextResponse } from 'next/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { AuditService } from '@/services/tenant/audit-service';
import { connectDB } from '@ajabadia/satellite-sdk/db';

export const revalidate = 0; // Evitar el cacheado estático de la API

/**
 * 📊 GET /api/admin/audit
 * Returns the combined SaaS audit logs for a tenant.
 */
export async function GET(request: Request) {
  try {
    // 1. Garantizar acceso seguro con rol mínimo de administrador
    const user = await ensureIndustrialAccess('ADMIN');
    
    // 2. Resolver conexión principal para validar sesión (si es necesario) y luego conectar logs
    await connectDB();

    const { searchParams } = new URL(request.url);
    // Filtrar por el tenant solicitado o el del propio usuario administrador por defecto
    const tenantId = searchParams.get('tenantId') || user.tenantId;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // 3. Recuperar y retornar la cronología consolidada de logs
    const logs = await AuditService.getCombinedLogsByTenant(tenantId, limit);
    
    return NextResponse.json(logs);
  } catch (error: unknown) {
    const err = error as Error;
    await AuditService.logEvent({
      tenantId: 'unknown',
      action: 'AUDIT_LOGS_FETCH_ERROR',
      entityType: 'SYSTEM',
      entityId: 'unknown',
      userId: 'system',
      userEmail: 'system',
      changedFields: { error: err.message || 'Unknown error' },
    });
    console.error('[API_GET_AUDIT_LOGS_ERROR]', error);
    const status = err.message === 'UNAUTHORIZED_ECOSYSTEM_ACCESS' ? 403 : 500;
    return NextResponse.json({ error: err.message || 'Unauthorized' }, { status });
  }
}
