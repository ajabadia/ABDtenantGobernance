/**
 * @purpose Gestiona políticas de permisos para inquilinos al recuperar y crear políticas.
 * @purpose_en Manages permission policies for tenants by fetching and creating policies.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:5,sig:vh6m1i
 * @lastUpdated 2026-06-24T10:34:30.648Z
 */

'use server'

import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { connectDB, withTenantContext } from '@ajabadia/satellite-sdk/db';;
import { PermissionPolicyRepository } from '@/lib/repositories/PermissionPolicyRepository';
import { PermissionService } from '@/services/tenant/permission-service';
import { TenantService } from '@/services/tenant/tenant-service';
import { AuditService } from '@/services/tenant/audit-service';

const policyRepository = new PermissionPolicyRepository();

async function getExplicitContext(tenantId: string) {
  try {
    const tenantConfig = await TenantService.getConfig(tenantId);
    return {
      tenantId: tenantConfig.tenantId,
      dbPrefix: tenantConfig.dbPrefix || tenantConfig.tenantId.toLowerCase().replace(/[^a-z0-9]/g, ''),
      isolationStrategy: tenantConfig.isolationStrategy || 'COLLECTION_PREFIX'
    };
    } catch (e) {
    return {
      tenantId,
      dbPrefix: tenantId.toLowerCase().replace(/[^a-z0-9]/g, ''),
      isolationStrategy: 'COLLECTION_PREFIX'
    };
  }
}

export async function fetchPoliciesAction(tenantId: string): Promise<{ data?: unknown; error?: string; }> {
  try {
    const explicitContext = await getExplicitContext(tenantId);
    return withTenantContext(async () => {
      try {
        await ensureIndustrialAccess('ADMIN');
        await connectDB();
        const policies = await policyRepository.find({ tenantId });
        return {
          data: policies.map(p => {
            const obj = p.toObject();
            return { ...obj, _id: obj._id.toString() };
          })
        };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        await AuditService.logEvent({
          tenantId: tenantId || 'unknown',
          action: 'POLICY_FETCH_ERROR',
          entityType: 'PERMISSION_POLICY',
          entityId: 'unknown',
          userId: 'system',
          userEmail: 'system',
          changedFields: { error: msg },
        });
        console.error('[PERMISSIONS_ACTION] fetchPoliciesAction Error:', msg);
        return { error: msg };
      }
    }, explicitContext);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await AuditService.logEvent({
      tenantId: tenantId || 'unknown',
      action: 'POLICY_FETCH_CONTEXT_ERROR',
      entityType: 'PERMISSION_POLICY',
      entityId: 'unknown',
      userId: 'system',
      userEmail: 'system',
      changedFields: { error: msg },
    });
    return { error: msg };
  }
}

export async function createPolicyAction(tenantId: string, data: {
  name: string;
  description?: string;
  effect: 'ALLOW' | 'DENY';
  resources: string[];
  actions: string[];
  isActive?: boolean;
}): Promise<{ data?: unknown; error?: string; }> {
  try {
    const explicitContext = await getExplicitContext(tenantId);
    return withTenantContext(async () => {
      try {
        const user = await ensureIndustrialAccess('ADMIN');
        await connectDB();
        const policy = await PermissionService.createPolicy(tenantId, user.id, data, user.email);
        return { data: policy };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        await AuditService.logEvent({
          tenantId: tenantId || 'unknown',
          action: 'POLICY_CREATE_ERROR',
          entityType: 'PERMISSION_POLICY',
          entityId: 'unknown',
          userId: 'system',
          userEmail: 'system',
          changedFields: { error: msg },
        });
        console.error('[PERMISSIONS_ACTION] createPolicyAction Error:', msg);
        return { error: msg };
      }
    }, explicitContext);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await AuditService.logEvent({
      tenantId: tenantId || 'unknown',
      action: 'POLICY_CREATE_CONTEXT_ERROR',
      entityType: 'PERMISSION_POLICY',
      entityId: 'unknown',
      userId: 'system',
      userEmail: 'system',
      changedFields: { error: msg },
    });
    return { error: msg };
  }
}
