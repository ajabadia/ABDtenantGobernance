/**
 * @purpose Gestiona el manejo de permisos efectivos y aplicaciones para grupos de inquilinos, manejando jerarquías recursivas.
 * @purpose_en Manages the resolution of effective permissions and applications for tenant groups, handling recursive hierarchies.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:3,sig:p00svs
 * @lastUpdated 2026-06-23T23:28:48.829Z
 */

import { PermissionPolicySchema, type PermissionPolicy } from '@/lib/schemas/permissions';
import { PermissionGroupRepository } from '@/lib/repositories/PermissionGroupRepository';
import { PermissionPolicyRepository } from '@/lib/repositories/PermissionPolicyRepository';

const groupRepository = new PermissionGroupRepository();
const policyRepository = new PermissionPolicyRepository();

export class PermissionGroupResolver {
  /**
   * Resuelve todas las aplicaciones permitidas recursivamente a partir de los grupos dados
   */
  static async resolveEffectiveApps(
    tenantId: string,
    groupIds: string[]
  ): Promise<string[]> {
    const apps = new Set<string>();
    const visited = new Set<string>();
    const queue = [...groupIds];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const group = await groupRepository.findById(currentId);
      if (!group || group.tenantId !== tenantId) continue;

      if (group.allowedApps) {
        group.allowedApps.forEach(app => apps.add(app));
      }

      if (group.parentId) {
        queue.push(group.parentId.toString());
      }
    }

    return Array.from(apps);
  }

  /**
   * Resuelve todas las políticas de permiso asociadas a los grupos (incluyendo jerarquías recursivas)
   */
  static async resolveEffectivePolicies(
    tenantId: string,
    groupIds: string[]
  ): Promise<PermissionPolicy[]> {
    const policyIds = new Set<string>();
    const visited = new Set<string>();
    const queue = [...groupIds];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const group = await groupRepository.findById(currentId);
      if (!group || group.tenantId !== tenantId) continue;

      if (group.policyIds) {
        group.policyIds.forEach(id => policyIds.add(id.toString()));
      }

      if (group.parentId) {
        queue.push(group.parentId.toString());
      }
    }

    const docs = await policyRepository.find({
      tenantId,
      _id: { $in: Array.from(policyIds) } as never,
      isActive: true,
    });

    return docs.map(doc => {
      const obj = doc.toObject();
      if (obj._id) obj._id = obj._id.toString();
      return PermissionPolicySchema.parse(obj);
    });
  }
}
