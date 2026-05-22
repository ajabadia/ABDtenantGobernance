'use server'

import mongoose from 'mongoose';
import connectDB from '@/lib/database/mongodb';
import { ensureIndustrialAccess } from '@/lib/session';
import { delegatedRoleRepository } from '@/lib/repositories/DelegatedRoleRepository';
import { withTenantContext } from '@/lib/database/tenant-model';

export async function fetchDelegationsAction(tenantId: string) {
  return withTenantContext(async () => {
    try {
      await ensureIndustrialAccess('ADMIN');
      await connectDB();
      const delegations = await delegatedRoleRepository.find({ tenantId });
      return {
        data: delegations.map(d => {
          const obj = d.toObject();
          return {
            ...obj,
            _id: obj._id.toString(),
            groupIds: obj.groupIds?.map((id: unknown) => String(id)) || [],
            policyIds: obj.policyIds?.map((id: unknown) => String(id)) || [],
            startsAt: obj.startsAt.toISOString(),
            expiresAt: obj.expiresAt.toISOString()
          };
        })
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[DELEGATIONS_ACTION] fetchDelegationsAction Error:', msg);
      return { error: msg };
    }
  });
}

export async function createDelegationAction(tenantId: string, data: {
  delegateeId: string;
  groupIds?: string[];
  policyIds?: string[];
  startsAt: string;
  expiresAt: string;
  reason?: string;
}) {
  return withTenantContext(async () => {
    try {
      const user = await ensureIndustrialAccess('ADMIN');
      await connectDB();
      
      const delegationDoc = await delegatedRoleRepository.create({
        tenantId,
        delegatorId: user.id,
        delegateeId: data.delegateeId,
        groupIds: data.groupIds ? data.groupIds.map(id => new mongoose.Types.ObjectId(id)) : [],
        policyIds: data.policyIds ? data.policyIds.map(id => new mongoose.Types.ObjectId(id)) : [],
        startsAt: new Date(data.startsAt),
        expiresAt: new Date(data.expiresAt),
        isActive: true,
        reason: data.reason
      });

      return { data: { ...delegationDoc.toObject(), _id: delegationDoc._id.toString() } };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[DELEGATIONS_ACTION] createDelegationAction Error:', msg);
      return { error: msg };
    }
  });
}

export async function revokeDelegationAction(delegationId: string, tenantId: string) {
  return withTenantContext(async () => {
    try {
      await ensureIndustrialAccess('ADMIN');
      await connectDB();
      
      await delegatedRoleRepository.update(delegationId, { isActive: false });
      
      return { success: true };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[DELEGATIONS_ACTION] revokeDelegationAction Error:', msg);
      return { error: msg };
    }
  });
}
