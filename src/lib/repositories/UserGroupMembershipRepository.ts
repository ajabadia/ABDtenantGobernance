/**
 * @purpose Gestiona datos de pertenencia de grupo de usuarios para un inquilino específico.
 * @purpose_en Manages user group membership data for a specific tenant.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:3,sig:opqdpc
 * @lastUpdated 2026-06-23T21:47:35.628Z
 */

import { TenantAwareRepository } from './TenantAwareRepository';
import UserGroupMembership, { type IUserGroupMembership } from '@/models/UserGroupMembership';
import type { QueryFilter } from 'mongoose';

export class UserGroupMembershipRepository extends TenantAwareRepository<IUserGroupMembership> {
  constructor() {
    super(UserGroupMembership);
  }

  async findByUserId(tenantId: string, userId: string): Promise<IUserGroupMembership[]> {
    return await this.find({ tenantId, userId } as QueryFilter<IUserGroupMembership>);
  }
  
  async findByGroupId(tenantId: string, groupId: string): Promise<IUserGroupMembership[]> {
    return await this.find({ tenantId, groupId } as QueryFilter<IUserGroupMembership>);
  }

  async deleteMany(filter: QueryFilter<IUserGroupMembership>): Promise<void> {
    await this.model.deleteMany(filter);
  }

  async insertMany(docs: Partial<IUserGroupMembership>[]): Promise<void> {
    await this.model.insertMany(docs);
  }
}

export const userGroupMembershipRepository = new UserGroupMembershipRepository();
