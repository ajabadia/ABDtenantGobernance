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
