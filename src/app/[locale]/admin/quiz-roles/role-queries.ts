/**
 * @purpose Proporciona datos de personalización de rol para un inquilino.
 * @purpose_en Fetches and returns role customization data for a given tenant.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:1wr19xq
 * @lastUpdated 2026-06-24T10:34:40.877Z
 */

'use server'

import { TenantService } from '@/services/tenant/tenant-service';
import { AuditService } from '@/services/tenant/audit-service';

interface RoleCustomizationResponse {
  roleCustomization?: {
    roleLiterals: {
      CREATOR: { es: string; en: string };
      RECIPIENT: { es: string; en: string };
      AUDITOR: { es: string; en: string };
    }
  };
  error?: string;
}

export async function fetchTenantRoleCustomizationAction(
  tenantId: string
): Promise<RoleCustomizationResponse> {
  try {
    const tenantConfig = await TenantService.getConfig(tenantId);
    return { roleCustomization: tenantConfig.roleCustomization };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await AuditService.logEvent({
      tenantId: tenantId || 'unknown',
      action: 'ROLE_CUSTOMIZATION_FETCH_ERROR',
      entityType: 'CONFIG',
      entityId: 'unknown',
      userId: 'system',
      userEmail: 'system',
      changedFields: { error: msg },
    });
    return { error: msg };
  }
}
