/**
 * @purpose Gestiona grupos de permisos y políticas.
 * @purpose_en Manages permission groups and policies.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:1hzlqe5
 * @lastUpdated 2026-06-23T23:28:56.399Z
 */

import { PermissionGroupService, PermissionGroupResolver } from './permission-group-service';
import { PermissionPolicyService } from './permission-policy-service';
import type { PermissionGroup, PermissionPolicy } from '@/lib/schemas/permissions';

/**
 * PermissionService - Facade that combines group and policy services
 */
export class PermissionService {
  static async createGroup(...args: Parameters<typeof PermissionGroupService.createGroup>): Promise<PermissionGroup> {
    return PermissionGroupService.createGroup(...args);
  }
  static async updateGroup(...args: Parameters<typeof PermissionGroupService.updateGroup>): Promise<PermissionGroup> {
    return PermissionGroupService.updateGroup(...args);
  }
  static async deleteGroup(...args: Parameters<typeof PermissionGroupService.deleteGroup>): Promise<void> {
    return PermissionGroupService.deleteGroup(...args);
  }
  static async createPolicy(...args: Parameters<typeof PermissionPolicyService.createPolicy>): Promise<PermissionPolicy> {
    return PermissionPolicyService.createPolicy(...args);
  }
  static async updatePolicy(...args: Parameters<typeof PermissionPolicyService.updatePolicy>): Promise<PermissionPolicy> {
    return PermissionPolicyService.updatePolicy(...args);
  }
  static async deletePolicy(...args: Parameters<typeof PermissionPolicyService.deletePolicy>): Promise<void> {
    return PermissionPolicyService.deletePolicy(...args);
  }
  static async resolveEffectiveApps(...args: Parameters<typeof PermissionGroupResolver.resolveEffectiveApps>): Promise<string[]> {
    return PermissionGroupResolver.resolveEffectiveApps(...args);
  }
  static async resolveEffectivePolicies(...args: Parameters<typeof PermissionGroupResolver.resolveEffectivePolicies>): Promise<PermissionPolicy[]> {
    return PermissionGroupResolver.resolveEffectivePolicies(...args);
  }
}
