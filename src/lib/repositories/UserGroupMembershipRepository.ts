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
