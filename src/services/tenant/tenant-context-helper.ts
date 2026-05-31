'use server'

import { TenantService } from './tenant-service';

export interface TenantContext {
  tenantId: string;
  dbPrefix: string;
  isolationStrategy: string;
}

export async function getExplicitContext(tenantId: string): Promise<TenantContext> {
  try {
    const tenantConfig = await TenantService.getConfig(tenantId);
    return {
      tenantId: tenantConfig.tenantId,
      dbPrefix: tenantConfig.dbPrefix || tenantConfig.tenantId.toLowerCase().replace(/[^a-z0-9]/g, ''),
      isolationStrategy: tenantConfig.isolationStrategy || 'COLLECTION_PREFIX',
    };
  } catch {
    return {
      tenantId,
      dbPrefix: tenantId.toLowerCase().replace(/[^a-z0-9]/g, ''),
      isolationStrategy: 'COLLECTION_PREFIX',
    };
  }
}
