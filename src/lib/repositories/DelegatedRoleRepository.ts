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
