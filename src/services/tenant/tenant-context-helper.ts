/**
 * @purpose Gestiona y recupera información del contexto del inquilino.
 * @purpose_en Manages and retrieves tenant context information.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:1,sig:iymlws
 * @lastUpdated 2026-06-23T21:53:03.190Z
 */

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
