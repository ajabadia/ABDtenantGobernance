'use server'

import { connectDB } from '@ajabadia/satellite-sdk';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk';
import { PermissionGroupRepository } from '@/lib/repositories/PermissionGroupRepository';
import { PermissionPolicyRepository } from '@/lib/repositories/PermissionPolicyRepository';
import { PermissionService } from '@/services/tenant/permission-service';
import { withTenantContext } from '@ajabadia/satellite-sdk';
import { TenantService } from '@/services/tenant/tenant-service';

const groupRepository = new PermissionGroupRepository();
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
    console.warn(`[getExplicitContext] Config not found for tenantId: ${tenantId}, using default derivation:`, e);
    return {
      tenantId,
      dbPrefix: tenantId.toLowerCase().replace(/[^a-z0-9]/g, ''),
      isolationStrategy: 'COLLECTION_PREFIX'
    };
  }
}

export async function fetchGroupsAction(tenantId: string): Promise<{ data?: unknown; error?: string; }> {
  try {
    const explicitContext = await getExplicitContext(tenantId);
    
    // 1. Intentar consulta bajo el contexto explícito del tenant
    let explicitResult = null;
    try {
      explicitResult = await withTenantContext(async () => {
        await ensureIndustrialAccess('ADMIN');
        await connectDB();
        const groups = await groupRepository.find({ tenantId });
        if (groups.length > 0) {
          return {
            data: groups.map(g => {
              const obj = g.toObject();
              return {
                ...obj,
                _id: obj._id.toString(),
                parentId: obj.parentId ? obj.parentId.toString() : null,
                policyIds: obj.policyIds ? obj.policyIds.map((id: unknown) => String(id)) : []
              };
            })
          };
        }
        return null;
      }, explicitContext);
    } catch (err) {
      console.warn('[fetchGroupsAction] Query under explicit context failed, falling back:', err);
    }

    if (explicitResult) {
      return explicitResult;
    }

    // 2. Fallback: Consultar bajo el contexto de sesión por defecto (desarrollo/colecciones compartidas)
    return withTenantContext(async () => {
      try {
        await ensureIndustrialAccess('ADMIN');
        await connectDB();
        const groups = await groupRepository.find({ tenantId });
        return {
          data: groups.map(g => {
            const obj = g.toObject();
            return {
              ...obj,
              _id: obj._id.toString(),
              parentId: obj.parentId ? obj.parentId.toString() : null,
              policyIds: obj.policyIds ? obj.policyIds.map((id: unknown) => String(id)) : []
            };
          })
        };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[PERMISSIONS_ACTION] fetchGroupsAction Fallback Error:', msg);
        return { error: msg };
      }
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { error: msg };
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
        console.error('[PERMISSIONS_ACTION] fetchPoliciesAction Error:', msg);
        return { error: msg };
      }
    }, explicitContext);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { error: msg };
  }
}

export async function createGroupAction(tenantId: string, data: {
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  policyIds?: string[];
  allowedApps?: string[];
}): Promise<{ data?: unknown; error?: string; }> {
  try {
    const explicitContext = await getExplicitContext(tenantId);
    return withTenantContext(async () => {
      try {
        const user = await ensureIndustrialAccess('ADMIN');
        await connectDB();
        const group = await PermissionService.createGroup(tenantId, user.id, data, user.email);
        return { data: group };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[PERMISSIONS_ACTION] createGroupAction Error:', msg);
        return { error: msg };
      }
    }, explicitContext);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { error: msg };
  }
}

export async function updateGroupAction(groupId: string, tenantId: string, data: {
  name?: string;
  description?: string;
  parentId?: string | null;
  policyIds?: string[];
  allowedApps?: string[];
}): Promise<{ data?: unknown; error?: string; }> {
  try {
    const explicitContext = await getExplicitContext(tenantId);
    return withTenantContext(async () => {
      try {
        const user = await ensureIndustrialAccess('ADMIN');
        await connectDB();
        const group = await PermissionService.updateGroup(groupId, tenantId, user.id, data, user.email);
        return { data: group };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[PERMISSIONS_ACTION] updateGroupAction Error:', msg);
        return { error: msg };
      }
    }, explicitContext);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { error: msg };
  }
}

export async function deleteGroupAction(groupId: string, tenantId: string): Promise<{ success?: boolean; error?: string; }> {
  try {
    const explicitContext = await getExplicitContext(tenantId);
    return withTenantContext(async () => {
      try {
        const user = await ensureIndustrialAccess('ADMIN');
        await connectDB();
        await PermissionService.deleteGroup(groupId, tenantId, user.id, user.email);
        return { success: true };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[PERMISSIONS_ACTION] deleteGroupAction Error:', msg);
        return { error: msg };
      }
    }, explicitContext);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
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
        console.error('[PERMISSIONS_ACTION] createPolicyAction Error:', msg);
        return { error: msg };
      }
    }, explicitContext);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { error: msg };
  }
}
