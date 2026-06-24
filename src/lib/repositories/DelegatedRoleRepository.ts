/**
 * @purpose Gestiona roles delegados para inquilinos proporcionando métodos para encontrar roles activos por delegado y roles por delegante.
 * @purpose_en Manages delegated roles for tenants by providing methods to find active roles by delegatee and roles by delegator.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:3,sig:1tz805l
 * @lastUpdated 2026-06-23T21:47:14.765Z
 */

import { TenantAwareRepository } from './TenantAwareRepository';
import DelegatedRole, { type IDelegatedRole } from '@/models/DelegatedRole';
import type { QueryFilter } from 'mongoose';

export class DelegatedRoleRepository extends TenantAwareRepository<IDelegatedRole> {
  constructor() {
    super(DelegatedRole);
  }

  async findActiveByDelegatee(tenantId: string, delegateeId: string): Promise<IDelegatedRole[]> {
    const now = new Date();
    return await this.find({
      tenantId,
      delegateeId,
      isActive: true,
      startsAt: { $lte: now },
      expiresAt: { $gte: now },
    } as QueryFilter<IDelegatedRole>);
  }

  async findByDelegator(tenantId: string, delegatorId: string): Promise<IDelegatedRole[]> {
    return await this.find({ tenantId, delegatorId } as QueryFilter<IDelegatedRole>);
  }
}

export const delegatedRoleRepository = new DelegatedRoleRepository();
