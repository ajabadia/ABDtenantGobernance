/**
 * @purpose Gestiona grupos de permisos para inquilinos dentro del proyecto ABDSuite, incluyendo operaciones de creación, actualización y eliminación.
 * @purpose_en Manages permission groups for tenants within the ABDSuite project, including creation, update, and deletion operations.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:gkn2k9
 * @lastUpdated 2026-06-23T21:52:34.990Z
 */

import { PermissionGroupSchema, type PermissionGroup } from '@/lib/schemas/permissions';
import { PermissionGroupRepository } from '@/lib/repositories/PermissionGroupRepository';
import { AuditService } from './audit-service';
import type { IPermissionGroup } from '@/models/PermissionGroup';

const groupRepository = new PermissionGroupRepository();

function normalizeDoc<T>(doc: { toObject: () => Record<string, unknown> }, schema: typeof PermissionGroupSchema): T {
  const obj = doc.toObject();
  if (obj._id) obj._id = (obj._id as { toString: () => string }).toString();
  if (obj.parentId) obj.parentId = (obj.parentId as { toString: () => string }).toString();
  if (obj.policyIds) obj.policyIds = (obj.policyIds as unknown[]).map((id: unknown) => String(id));
  return schema.parse(obj) as T;
}

export class PermissionGroupService {
  static async createGroup(tenantId: string, userId: string, data: Partial<PermissionGroup>, userEmail = 'SYSTEM'): Promise<PermissionGroup> {
    const parentId = data.parentId;
    if (parentId) {
      const parent = await groupRepository.findById(parentId);
      if (!parent) throw new Error('El grupo padre no existe');
    }
    const newGroupData = PermissionGroupSchema.parse({ ...data, tenantId, createdAt: new Date(), updatedAt: new Date() });
    const doc = await groupRepository.create(newGroupData as unknown as IPermissionGroup);
    AuditService.logEvent({ tenantId, action: 'CREATE_PERMISSION_GROUP', entityType: 'PERMISSION_GROUP', entityId: doc._id.toString(), userId, userEmail, changedFields: { name: doc.name, slug: doc.slug, parentId: doc.parentId, allowedApps: doc.allowedApps, policyIds: doc.policyIds } });
    return normalizeDoc<PermissionGroup>(doc, PermissionGroupSchema);
  }

  static async updateGroup(groupId: string, tenantId: string, userId: string, data: Partial<PermissionGroup>, userEmail = 'SYSTEM'): Promise<PermissionGroup> {
    const group = await groupRepository.findById(groupId);
    if (!group) throw new Error('Grupo de permisos no encontrado');
    const parentId = data.parentId;
    if (parentId) {
      if (parentId === groupId) throw new Error('CIRCULAR_DEPENDENCY_DETECTED');
      let currentParentId: string | undefined = parentId;
      const visited = new Set<string>();
      while (currentParentId) {
        if (visited.has(currentParentId) || currentParentId === groupId) throw new Error('CIRCULAR_DEPENDENCY_DETECTED');
        visited.add(currentParentId);
        const parent = await groupRepository.findById(currentParentId);
        currentParentId = parent?.parentId?.toString();
      }
    }
    const doc = await groupRepository.update(groupId, { ...data, updatedAt: new Date() });
    if (!doc) throw new Error('Error al actualizar el grupo de permisos');
    AuditService.logEvent({ tenantId, action: 'UPDATE_PERMISSION_GROUP', entityType: 'PERMISSION_GROUP', entityId: groupId, userId, userEmail, changedFields: data, previousState: { name: group.name, parentId: group.parentId, allowedApps: group.allowedApps, policyIds: group.policyIds } });
    return normalizeDoc<PermissionGroup>(doc, PermissionGroupSchema);
  }

  static async deleteGroup(groupId: string, tenantId: string, userId: string, userEmail = 'SYSTEM'): Promise<void> {
    const children = await groupRepository.findByParentId(tenantId, groupId);
    if (children.length > 0) throw new Error('DEPENDENT_SUBGROUPS_EXIST');
    const group = await groupRepository.findById(groupId);
    if (!group) throw new Error('Grupo no encontrado');
    await groupRepository.delete(groupId);
    AuditService.logEvent({ tenantId, action: 'DELETE_PERMISSION_GROUP', entityType: 'PERMISSION_GROUP', entityId: groupId, userId, userEmail, changedFields: {}, previousState: { name: group.name, slug: group.slug } });
  }
}

export { PermissionGroupResolver } from './permission-group-resolver';
