/**
 * @purpose Gestiona operaciones relacionadas con espacios dentro de un inquilino, incluyendo encontrar espacios mediante slug, ID de padre y ruta.
 * @purpose_en Manages operations related to spaces within a tenant, including finding spaces by slug, parent ID, and path.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:dp9fks
 * @lastUpdated 2026-06-23T23:28:08.239Z
 */

import { TenantAwareRepository } from './TenantAwareRepository';
import Space, { type ISpace } from '@/models/Space';
import type { QueryFilter } from 'mongoose';

export class SpaceRepository extends TenantAwareRepository<ISpace> {
  constructor() {
    super(Space);
  }

  /**
   * Busca un espacio por su slug único dentro del tenant
   */
  async findBySlug(tenantId: string, slug: string): Promise<ISpace | null> {
    return await this.findOne({ tenantId, slug } as QueryFilter<ISpace>);
  }

  /**
   * Obtiene la lista de sub-espacios inmediatos bajo un padre (o los de nivel raíz si es nulo)
   */
  async findByParentId(tenantId: string, parentSpaceId: string | null): Promise<ISpace[]> {
    const filter: QueryFilter<ISpace> = { tenantId };
    if (parentSpaceId) {
      filter.parentSpaceId = parentSpaceId;
    } else {
      filter.parentSpaceId = { $exists: false } as QueryFilter<ISpace>['parentSpaceId']; // mongoose query specific
    }
    return await this.find(filter);
  }

  /**
   * Obtiene un espacio por su ruta jerárquica materializada (ej. "/mates/algebra")
   */
  async findByPath(tenantId: string, path: string): Promise<ISpace | null> {
    return await this.findOne({ tenantId, materializedPath: path });
  }
}
