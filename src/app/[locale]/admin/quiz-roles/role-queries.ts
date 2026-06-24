/**
 * @purpose Proporciona datos de personalización de rol para un inquilino.
 * @purpose_en Fetches and returns role customization data for a given tenant.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:1,sig:krz9fl
 * @lastUpdated 2026-06-23T21:42:28.430Z
 */

'use server'

import { TenantService } from '@/services/tenant/tenant-service';

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
    return { error: msg };
  }
}
