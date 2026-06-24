/**
 * @purpose Gestiona delegaciones para permisos de inquilino.
 * @purpose_en Manages delegations for tenant permissions.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:3,imports:4,sig:1mwtpgq
 * @lastUpdated 2026-06-24T10:34:19.359Z
 */

'use server'

import mongoose from 'mongoose';
import { connectDB, ensureIndustrialAccess, withTenantContext } from '@ajabadia/satellite-sdk';
import { delegatedRoleRepository } from '@/lib/repositories/DelegatedRoleRepository';
import { AuditService } from '@/services/tenant/audit-service';

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
      await AuditService.logEvent({
        tenantId: tenantId || 'unknown',
        action: 'DELEGATION_FETCH_ERROR',
        entityType: 'PERMISSION_POLICY',
        entityId: 'unknown',
        userId: 'system',
        userEmail: 'system',
        changedFields: { error: msg },
      });
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

      await AuditService.logEvent({
        tenantId: tenantId || 'unknown',
        action: 'DELEGATION_CREATE_SUCCESS',
        entityType: 'PERMISSION_POLICY',
        entityId: delegationDoc._id.toString() || 'unknown',
        userId: user.email || 'system',
        userEmail: user.email || 'system',
        changedFields: { delegateeId: data.delegateeId, startsAt: data.startsAt, expiresAt: data.expiresAt },
      });

      return { data: { ...delegationDoc.toObject(), _id: delegationDoc._id.toString() } };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      await AuditService.logEvent({
        tenantId: tenantId || 'unknown',
        action: 'DELEGATION_CREATE_ERROR',
        entityType: 'PERMISSION_POLICY',
        entityId: 'unknown',
        userId: 'system',
        userEmail: 'system',
        changedFields: { error: msg },
      });
      console.error('[DELEGATIONS_ACTION] createDelegationAction Error:', msg);
      return { error: msg };
    }
  });
}

export async function revokeDelegationAction(delegationId: string, tenantId: string) {
  return withTenantContext(async () => {
    try {
      const user = await ensureIndustrialAccess('ADMIN');
      await connectDB();
      
      await delegatedRoleRepository.update(delegationId, { isActive: false });

      await AuditService.logEvent({
        tenantId: tenantId || 'unknown',
        action: 'DELEGATION_REVOKE_SUCCESS',
        entityType: 'PERMISSION_POLICY',
        entityId: delegationId || 'unknown',
        userId: user.email || 'system',
        userEmail: user.email || 'system',
        changedFields: {},
      });
      
      return { success: true };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      await AuditService.logEvent({
        tenantId: tenantId || 'unknown',
        action: 'DELEGATION_REVOKE_ERROR',
        entityType: 'PERMISSION_POLICY',
        entityId: delegationId || 'unknown',
        userId: 'system',
        userEmail: 'system',
        changedFields: { error: msg },
      });
      console.error('[DELEGATIONS_ACTION] revokeDelegationAction Error:', msg);
      return { error: msg };
    }
  });
}
