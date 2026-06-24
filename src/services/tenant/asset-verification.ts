/**
 * @purpose Valida la existencia y soberanía de un activo dentro de su inquilino original.
 * @purpose_en Validates the existence and sovereignty of an asset within its origin tenant.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:3,sig:arhput
 * @lastUpdated 2026-06-24T10:34:56.364Z
 */

import mongoose from 'mongoose';
import AssetSpaceLink from '@/models/AssetSpaceLink';
import { AuditService } from '@/services/tenant/audit-service';

/**
 * 🔒 Valida la existencia y pertenencia del activo en su satélite origen
 */
export async function verifyAssetSovereignty(tenantId: string, assetId: string): Promise<boolean> {
  let url = '';
  if (assetId.startsWith('quiz-')) {
    url = `http://localhost:5020/api/internal/assets/verify?tenantId=${tenantId}&assetId=${assetId}`;
  } else if (assetId.startsWith('doc-') || assetId.startsWith('corpus-')) {
    url = `http://localhost:5005/api/internal/assets/verify?tenantId=${tenantId}&assetId=${assetId}`;
  } else {
    if (process.env.NODE_ENV !== 'production') {
      return assetId.startsWith('test-') || assetId.startsWith('demo-') || assetId.length > 5;
    }
    return false;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'x-internal-api-secret': process.env.INTERNAL_API_SECRET || 'dev-secret-secure-123456'
      }
    });
    clearTimeout(timeoutId);
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.belongsToTenant;
  } catch (err) {
    clearTimeout(timeoutId);
    await AuditService.logEvent({
      tenantId: tenantId || 'unknown',
      action: 'ASSET_SOVEREIGNTY_VERIFICATION_ERROR',
      entityType: 'SPACE',
      entityId: assetId || 'unknown',
      userId: 'system',
      userEmail: 'system',
      changedFields: { error: err instanceof Error ? err.message : String(err) },
    });
    console.warn(`[SOVEREIGNTY_VERIFICATION_FAILED] Failed to verify asset ${assetId} via inter-service API:`, err);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SOVEREIGNTY_DEV_BYPASS] Allowing asset ${assetId} on tenant ${tenantId} in local dev.`);
      return true;
    }
    return false;
  }
}

/**
 * Ejecuta una operación de enlace con soporte de sesión transaccional de MongoDB
 */
export async function withAssetTransaction<T>(
  operation: (session: mongoose.ClientSession | null) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession().catch(() => null);
  if (!session) {
    return operation(null);
  }
  session.startTransaction();
  try {
    const result = await operation(session);
    await session.commitTransaction();
    session.endSession();
    return result;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}
