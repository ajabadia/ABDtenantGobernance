/**
 * @purpose Gestiona membresias de grupos de usuarios para inquilinos mediante la recuperación, actualización y eliminación de membresías.
 * @purpose_en Manages user group memberships for tenants by fetching, updating, and deleting memberships.
 * @refactorable true (contains multiple functions with similar logic)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:3,imports:5,sig:g72999
 * @lastUpdated 2026-06-24T10:34:51.483Z
 */

'use server'

import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { connectDB, withTenantContext } from '@ajabadia/satellite-sdk/db';
import { userGroupMembershipRepository } from '@/lib/repositories/UserGroupMembershipRepository';
import mongoose, { type QueryFilter } from 'mongoose';
import { type IUserGroupMembership } from '@/models/UserGroupMembership';
import { AuditService } from '@/services/tenant/audit-service';

export async function fetchTenantMembershipsAction(tenantId: string) {
  return withTenantContext(async () => {
    try {
      await ensureIndustrialAccess('ADMIN');
      await connectDB();
      const memberships = await userGroupMembershipRepository.find({ tenantId });
      return {
        data: memberships.map(m => {
          const obj = m.toObject();
          return {
            ...obj,
            _id: obj._id.toString(),
            groupId: obj.groupId.toString()
          };
        })
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      await AuditService.logEvent({
        tenantId: tenantId || 'unknown',
        action: 'MEMBERSHIPS_FETCH_ERROR',
        entityType: 'PERMISSION_GROUP',
        entityId: 'unknown',
        userId: 'system',
        userEmail: 'system',
        changedFields: { error: msg },
      });
      console.error('[MEMBERSHIPS_ACTION] fetchTenantMemberships Error:', msg);
      return { error: msg };
    }
  });
}

export async function updateUserGroupsAction(tenantId: string, userId: string, groupIds: string[]) {
  return withTenantContext(async () => {
    try {
      const currentUser = await ensureIndustrialAccess('ADMIN');
      await connectDB();
      
      await userGroupMembershipRepository.deleteMany({ tenantId, userId } as unknown as QueryFilter<IUserGroupMembership>);
      
      if (groupIds.length > 0) {
        const newMemberships = groupIds.map(gId => ({
          tenantId,
          userId,
          groupId: new mongoose.Types.ObjectId(gId),
          assignedBy: currentUser.id
        }));
        await userGroupMembershipRepository.insertMany(newMemberships as unknown as Partial<IUserGroupMembership>[]);
      }
      
      await AuditService.logEvent({
        tenantId: tenantId || 'unknown',
        action: 'MEMBERSHIPS_UPDATE_USER_GROUPS_SUCCESS',
        entityType: 'PERMISSION_GROUP',
        entityId: userId || 'unknown',
        userId: currentUser.email || 'system',
        userEmail: currentUser.email || 'system',
        changedFields: { groupIds, count: groupIds.length },
      });

      return { success: true };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      await AuditService.logEvent({
        tenantId: tenantId || 'unknown',
        action: 'MEMBERSHIPS_UPDATE_USER_GROUPS_ERROR',
        entityType: 'PERMISSION_GROUP',
        entityId: userId || 'unknown',
        userId: 'system',
        userEmail: 'system',
        changedFields: { error: msg },
      });
      console.error('[MEMBERSHIPS_ACTION] updateUserGroups Error:', msg);
      return { error: msg };
    }
  });
}

export async function updateGroupUsersAction(tenantId: string, groupId: string, userIds: string[]) {
  return withTenantContext(async () => {
    try {
      const currentUser = await ensureIndustrialAccess('ADMIN');
      await connectDB();
      
      const groupIdObj = new mongoose.Types.ObjectId(groupId);

      await userGroupMembershipRepository.deleteMany({ tenantId, groupId: groupIdObj } as unknown as QueryFilter<IUserGroupMembership>);
      
      if (userIds.length > 0) {
        const newMemberships = userIds.map(uId => ({
          tenantId,
          userId: uId,
          groupId: groupIdObj,
          assignedBy: currentUser.id
        }));
        await userGroupMembershipRepository.insertMany(newMemberships as unknown as Partial<IUserGroupMembership>[]);
      }
      
      await AuditService.logEvent({
        tenantId: tenantId || 'unknown',
        action: 'MEMBERSHIPS_UPDATE_GROUP_USERS_SUCCESS',
        entityType: 'PERMISSION_GROUP',
        entityId: groupId || 'unknown',
        userId: currentUser.email || 'system',
        userEmail: currentUser.email || 'system',
        changedFields: { userIds, count: userIds.length },
      });

      return { success: true };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      await AuditService.logEvent({
        tenantId: tenantId || 'unknown',
        action: 'MEMBERSHIPS_UPDATE_GROUP_USERS_ERROR',
        entityType: 'PERMISSION_GROUP',
        entityId: groupId || 'unknown',
        userId: 'system',
        userEmail: 'system',
        changedFields: { error: msg },
      });
      console.error('[MEMBERSHIPS_ACTION] updateGroupUsers Error:', msg);
      return { error: msg };
    }
  });
}
