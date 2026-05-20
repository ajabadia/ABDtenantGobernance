import { PermissionGroupSchema, type PermissionGroup } from '@/lib/schemas/permissions';
import { PermissionPolicySchema, type PermissionPolicy } from '@/lib/schemas/permissions';
import { PermissionGroupRepository } from '@/lib/repositories/PermissionGroupRepository';
import { PermissionPolicyRepository } from '@/lib/repositories/PermissionPolicyRepository';
import { AuditService } from './audit-service';
import type { IPermissionGroup } from '@/models/PermissionGroup';
import type { IPermissionPolicy } from '@/models/PermissionPolicy';

const groupRepository = new PermissionGroupRepository();
const policyRepository = new PermissionPolicyRepository();

export class PermissionService {
  /**
   * Crea un nuevo grupo de permisos
   */
  static async createGroup(
    tenantId: string,
    userId: string,
    data: Partial<PermissionGroup>,
    userEmail = 'SYSTEM'
  ): Promise<PermissionGroup> {
    const parentId = data.parentId;

    if (parentId) {
      const parent = await groupRepository.findById(parentId);
      if (!parent) {
        throw new Error('El grupo padre no existe');
      }
    }

    const newGroupData = PermissionGroupSchema.parse({
      ...data,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const doc = await groupRepository.create(newGroupData as unknown as IPermissionGroup);

    // Auditoría
    AuditService.logEvent({
      tenantId,
      action: 'CREATE_PERMISSION_GROUP',
      entityType: 'PERMISSION_GROUP',
      entityId: doc._id.toString(),
      userId,
      userEmail,
      changedFields: {
        name: doc.name,
        slug: doc.slug,
        parentId: doc.parentId,
        allowedApps: doc.allowedApps,
        policyIds: doc.policyIds,
      },
    });

    const obj = doc.toObject();
    if (obj._id) obj._id = obj._id.toString();
    if (obj.parentId) obj.parentId = obj.parentId.toString();
    obj.policyIds = obj.policyIds.map((id: unknown) => String(id));
    return PermissionGroupSchema.parse(obj);
  }

  /**
   * Actualiza un grupo de permisos y valida que no se produzcan ciclos de herencia recursivos
   */
  static async updateGroup(
    groupId: string,
    tenantId: string,
    userId: string,
    data: Partial<PermissionGroup>,
    userEmail = 'SYSTEM'
  ): Promise<PermissionGroup> {
    const group = await groupRepository.findById(groupId);
    if (!group) {
      throw new Error('Grupo de permisos no encontrado');
    }

    const parentId = data.parentId;

    // Validación estricta anti-ciclos jerárquicos
    if (parentId) {
      if (parentId === groupId) {
        throw new Error('CIRCULAR_DEPENDENCY_DETECTED');
      }

      let currentParentId: string | undefined = parentId;
      const visited = new Set<string>();

      while (currentParentId) {
        if (visited.has(currentParentId)) {
          throw new Error('CIRCULAR_DEPENDENCY_DETECTED');
        }
        visited.add(currentParentId);

        if (currentParentId === groupId) {
          throw new Error('CIRCULAR_DEPENDENCY_DETECTED');
        }

        const parent = await groupRepository.findById(currentParentId);
        currentParentId = parent?.parentId?.toString();
      }
    }

    const updatedData = {
      ...data,
      updatedAt: new Date(),
    };

    const doc = await groupRepository.update(groupId, updatedData);
    if (!doc) {
      throw new Error('Error al actualizar el grupo de permisos');
    }

    // Auditoría
    AuditService.logEvent({
      tenantId,
      action: 'UPDATE_PERMISSION_GROUP',
      entityType: 'PERMISSION_GROUP',
      entityId: groupId,
      userId,
      userEmail,
      changedFields: data,
      previousState: {
        name: group.name,
        parentId: group.parentId,
        allowedApps: group.allowedApps,
        policyIds: group.policyIds,
      },
    });

    const obj = doc.toObject();
    if (obj._id) obj._id = obj._id.toString();
    if (obj.parentId) obj.parentId = obj.parentId.toString();
    obj.policyIds = obj.policyIds.map((id: unknown) => String(id));
    return PermissionGroupSchema.parse(obj);
  }

  /**
   * Elimina un grupo si no tiene subgrupos hijos dependientes
   */
  static async deleteGroup(
    groupId: string,
    tenantId: string,
    userId: string,
    userEmail = 'SYSTEM'
  ): Promise<void> {
    // Buscar si hay hijos dependientes
    const children = await groupRepository.findByParentId(tenantId, groupId);
    if (children.length > 0) {
      throw new Error('DEPENDENT_SUBGROUPS_EXIST');
    }

    const group = await groupRepository.findById(groupId);
    if (!group) {
      throw new Error('Grupo no encontrado');
    }

    await groupRepository.delete(groupId);

    // Auditoría
    AuditService.logEvent({
      tenantId,
      action: 'DELETE_PERMISSION_GROUP',
      entityType: 'PERMISSION_GROUP',
      entityId: groupId,
      userId,
      userEmail,
      changedFields: {},
      previousState: {
        name: group.name,
        slug: group.slug,
      },
    });
  }

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
