/**
 * @purpose Gestiona y recupera grupos de permisos para un inquilino, incluyendo la recuperación y eliminación de acciones de grupo.
 * @purpose_en Manages and retrieves permission groups for a tenant, including fetching and deleting group actions.
 * @refactorable true (contains multiple functions with similar logic)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:4,imports:5,sig:14cxqei
 * @lastUpdated 2026-06-24T10:34:25.562Z
 */

'use server'

import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { connectDB, withTenantContext } from '@ajabadia/satellite-sdk/db';;
import { PermissionGroupRepository } from '@/lib/repositories/PermissionGroupRepository';
import { PermissionService } from '@/services/tenant/permission-service';
import { getExplicitContext } from '@/services/tenant/tenant-context-helper';
import { AuditService } from '@/services/tenant/audit-service';

const groupRepository = new PermissionGroupRepository();

export async function fetchGroupsAction(tenantId: string): Promise<{ data?: unknown; error?: string; }> {
  try {
    const explicitContext = await getExplicitContext(tenantId);

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
      await AuditService.logEvent({
        tenantId: tenantId || 'unknown',
        action: 'GROUP_FETCH_EXPLICIT_ERROR',
        entityType: 'PERMISSION_GROUP',
        entityId: 'unknown',
        userId: 'system',
        userEmail: 'system',
        changedFields: { error: err instanceof Error ? err.message : String(err) },
      });
      console.warn('[fetchGroupsAction] Query under explicit context failed, falling back:', err);
    }

    if (explicitResult) {
      return explicitResult;
    }

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
        await AuditService.logEvent({
          tenantId: tenantId || 'unknown',
          action: 'GROUP_FETCH_FALLBACK_ERROR',
          entityType: 'PERMISSION_GROUP',
          entityId: 'unknown',
          userId: 'system',
          userEmail: 'system',
          changedFields: { error: msg },
        });
        console.error('[PERMISSIONS_ACTION] fetchGroupsAction Fallback Error:', msg);
        return { error: msg };
      }
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await AuditService.logEvent({
      tenantId: tenantId || 'unknown',
      action: 'GROUP_FETCH_OUTER_ERROR',
      entityType: 'PERMISSION_GROUP',
      entityId: 'unknown',
      userId: 'system',
      userEmail: 'system',
      changedFields: { error: msg },
    });
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
        await AuditService.logEvent({
          tenantId: tenantId || 'unknown',
          action: 'GROUP_CREATE_ERROR',
          entityType: 'PERMISSION_GROUP',
          entityId: data.name || 'unknown',
          userId: 'system',
          userEmail: 'system',
          changedFields: { error: msg },
        });
        console.error('[PERMISSIONS_ACTION] createGroupAction Error:', msg);
        return { error: msg };
      }
    }, explicitContext);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await AuditService.logEvent({
      tenantId: tenantId || 'unknown',
      action: 'GROUP_CREATE_CONTEXT_ERROR',
      entityType: 'PERMISSION_GROUP',
      entityId: 'unknown',
      userId: 'system',
      userEmail: 'system',
      changedFields: { error: msg },
    });
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
        await AuditService.logEvent({
          tenantId: tenantId || 'unknown',
          action: 'GROUP_UPDATE_ERROR',
          entityType: 'PERMISSION_GROUP',
          entityId: groupId || 'unknown',
          userId: 'system',
          userEmail: 'system',
          changedFields: { error: msg },
        });
        console.error('[PERMISSIONS_ACTION] updateGroupAction Error:', msg);
        return { error: msg };
      }
    }, explicitContext);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await AuditService.logEvent({
      tenantId: tenantId || 'unknown',
      action: 'GROUP_UPDATE_CONTEXT_ERROR',
      entityType: 'PERMISSION_GROUP',
      entityId: groupId || 'unknown',
      userId: 'system',
      userEmail: 'system',
      changedFields: { error: msg },
    });
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
        await AuditService.logEvent({
          tenantId: tenantId || 'unknown',
          action: 'GROUP_DELETE_ERROR',
          entityType: 'PERMISSION_GROUP',
          entityId: groupId || 'unknown',
          userId: 'system',
          userEmail: 'system',
          changedFields: { error: msg },
        });
        console.error('[PERMISSIONS_ACTION] deleteGroupAction Error:', msg);
        return { error: msg };
      }
    }, explicitContext);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await AuditService.logEvent({
      tenantId: tenantId || 'unknown',
      action: 'GROUP_DELETE_CONTEXT_ERROR',
      entityType: 'PERMISSION_GROUP',
      entityId: groupId || 'unknown',
      userId: 'system',
      userEmail: 'system',
      changedFields: { error: msg },
    });
    return { error: msg };
  }
}
