/**
 * @purpose Gestiona pertenencias de grupos de usuarios para inquilinos mediante la recopilación, actualización y eliminación de membresías.
 * @purpose_en Manages user group memberships for tenants by fetching, updating, and deleting memberships.
 * @refactorable true (contains multiple functions with similar logic)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:3,imports:6,sig:zcjhce
 * @lastUpdated 2026-06-23T21:43:26.080Z
 */

'use server'

import { connectDB } from '@ajabadia/satellite-sdk';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk';
import { userGroupMembershipRepository } from '@/lib/repositories/UserGroupMembershipRepository';
import { withTenantContext } from '@ajabadia/satellite-sdk';
import mongoose, { type QueryFilter } from 'mongoose';
import { type IUserGroupMembership } from '@/models/UserGroupMembership';

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
      
      return { success: true };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
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
      
      return { success: true };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[MEMBERSHIPS_ACTION] updateGroupUsers Error:', msg);
      return { error: msg };
    }
  });
}
