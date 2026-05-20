import { TenantAwareRepository } from './TenantAwareRepository';
import PermissionPolicy, { type IPermissionPolicy } from '@/models/PermissionPolicy';

export class PermissionPolicyRepository extends TenantAwareRepository<IPermissionPolicy> {
  constructor() {
    super(PermissionPolicy);
  }
}
export const permissionPolicyRepository = new PermissionPolicyRepository();
