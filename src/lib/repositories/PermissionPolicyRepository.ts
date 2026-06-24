/**
 * @purpose Gestiona políticas de permisos para inquilinos.
 * @purpose_en Manages permission policies for tenants.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:2,sig:lgu0xx
 * @lastUpdated 2026-06-23T21:47:21.101Z
 */

import { TenantAwareRepository } from './TenantAwareRepository';
import PermissionPolicy, { type IPermissionPolicy } from '@/models/PermissionPolicy';

export class PermissionPolicyRepository extends TenantAwareRepository<IPermissionPolicy> {
  constructor() {
    super(PermissionPolicy);
  }
}
export const permissionPolicyRepository = new PermissionPolicyRepository();
