import { TenantAwareRepository } from './TenantAwareRepository';
import PermissionGroup, { type IPermissionGroup } from '@/models/PermissionGroup';
import type { QueryFilter } from 'mongoose';

export class PermissionGroupRepository extends TenantAwareRepository<IPermissionGroup> {
  constructor() {
    super(PermissionGroup);
  }

  /**
   * Busca un grupo de permisos por su slug único dentro del tenant
   */
  async findBySlug(tenantId: string, slug: string): Promise<IPermissionGroup | null> {
    return await this.findOne({ tenantId, slug } as QueryFilter<IPermissionGroup>);
  }

  /**
   * Obtiene la lista de sub-grupos inmediatos bajo un padre (o los de nivel raíz si es nulo)
   */
  async findByParentId(tenantId: string, parentId: string | null): Promise<IPermissionGroup[]> {
    const filter: QueryFilter<IPermissionGroup> = { tenantId } as QueryFilter<IPermissionGroup>;
    if (parentId) {
      (filter as Record<string, unknown>).parentId = parentId;
    } else {
      (filter as Record<string, unknown>).parentId = { $exists: false };
    }
    return await this.find(filter);
  }
}

export const permissionGroupRepository = new PermissionGroupRepository();
