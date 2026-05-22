'use server'

import connectDB from '@/lib/database/mongodb';
import { ensureIndustrialAccess } from '@/lib/session';
import { PermissionGroupRepository } from '@/lib/repositories/PermissionGroupRepository';
import { PermissionPolicyRepository } from '@/lib/repositories/PermissionPolicyRepository';
import { PermissionService } from '@/services/tenant/permission-service';
import { withTenantContext } from '@/lib/database/tenant-model';

const groupRepository = new PermissionGroupRepository();
const policyRepository = new PermissionPolicyRepository();

export async function fetchGroupsAction(tenantId: string) {
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
      console.error('[PERMISSIONS_ACTION] fetchGroupsAction Error:', msg);
      return { error: msg };
    }
  });
}

export async function fetchPoliciesAction(tenantId: string) {
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
  });
}

export async function createGroupAction(tenantId: string, data: {
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  policyIds?: string[];
  allowedApps?: string[];
}) {
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
  });
}

export async function updateGroupAction(groupId: string, tenantId: string, data: {
  name?: string;
  description?: string;
  parentId?: string | null;
  policyIds?: string[];
  allowedApps?: string[];
}) {
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
  });
}

export async function deleteGroupAction(groupId: string, tenantId: string) {
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
  });
}

export async function createPolicyAction(tenantId: string, data: {
  name: string;
  description?: string;
  effect: 'ALLOW' | 'DENY';
  resources: string[];
  actions: string[];
  isActive?: boolean;
}) {
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
  });
}
