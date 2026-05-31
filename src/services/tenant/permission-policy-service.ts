import { PermissionPolicySchema, type PermissionPolicy } from '@/lib/schemas/permissions';
import { PermissionPolicyRepository } from '@/lib/repositories/PermissionPolicyRepository';
import { PermissionGroupRepository } from '@/lib/repositories/PermissionGroupRepository';
import { AuditService } from './audit-service';
import type { IPermissionPolicy } from '@/models/PermissionPolicy';

const policyRepository = new PermissionPolicyRepository();
const groupRepository = new PermissionGroupRepository();

export class PermissionPolicyService {
  /**
   * Crea una política de permisos reusable
   */
  static async createPolicy(
    tenantId: string,
    userId: string,
    data: Partial<PermissionPolicy>,
    userEmail = 'SYSTEM'
  ): Promise<PermissionPolicy> {
    const newPolicyData = PermissionPolicySchema.parse({
      ...data,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const doc = await policyRepository.create(newPolicyData as unknown as IPermissionPolicy);

    AuditService.logEvent({
      tenantId,
      action: 'CREATE_PERMISSION_POLICY',
      entityType: 'PERMISSION_POLICY',
      entityId: doc._id.toString(),
      userId,
      userEmail,
      changedFields: {
        name: doc.name,
        effect: doc.effect,
        resources: doc.resources,
        actions: doc.actions,
      },
    });

    const obj = doc.toObject();
    if (obj._id) obj._id = obj._id.toString();
    return PermissionPolicySchema.parse(obj);
  }

  /**
   * Actualiza una política de permisos
   */
  static async updatePolicy(
    policyId: string,
    tenantId: string,
    userId: string,
    data: Partial<PermissionPolicy>,
    userEmail = 'SYSTEM'
  ): Promise<PermissionPolicy> {
    const policy = await policyRepository.findById(policyId);
    if (!policy) {
      throw new Error('Política no encontrada');
    }

    const doc = await policyRepository.update(policyId, {
      ...data,
      updatedAt: new Date(),
    });

    if (!doc) {
      throw new Error('Error al actualizar la política');
    }

    AuditService.logEvent({
      tenantId,
      action: 'UPDATE_PERMISSION_POLICY',
      entityType: 'PERMISSION_POLICY',
      entityId: policyId,
      userId,
      userEmail,
      changedFields: data,
      previousState: {
        name: policy.name,
        effect: policy.effect,
        resources: policy.resources,
        actions: policy.actions,
      },
    });

    const obj = doc.toObject();
    if (obj._id) obj._id = obj._id.toString();
    return PermissionPolicySchema.parse(obj);
  }

  /**
   * Elimina una política
   */
  static async deletePolicy(
    policyId: string,
    tenantId: string,
    actingUserId: string,
    actingUserEmail = 'SYSTEM'
  ): Promise<void> {
    const policy = await policyRepository.findById(policyId);
    if (!policy) {
      throw new Error('Política no encontrada');
    }

    // Comprobar si la política está en uso por algún grupo
    const usingGroups = await groupRepository.find({
      tenantId,
      policyIds: policyId as never,
    });

    if (usingGroups.length > 0) {
      throw new Error('POLICY_IN_USE_BY_GROUPS');
    }

    await policyRepository.delete(policyId);

    AuditService.logEvent({
      tenantId,
      action: 'DELETE_PERMISSION_POLICY',
      entityType: 'PERMISSION_POLICY',
      entityId: policyId,
      userId: actingUserId,
      userEmail: actingUserEmail,
      changedFields: {},
      previousState: {
        name: policy.name,
      },
    });
  }
}
