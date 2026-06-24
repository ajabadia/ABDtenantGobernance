/**
 * @purpose Gestiona operaciones relacionadas con enlaces de espacio-activo de manera sensible a los inquilinos, incluyendo encontrar por ID de activo o espacio y actualizar caminos.
 * @purpose_en Manages operations related to asset-space links in a tenant-aware manner, including finding by asset or space ID and updating paths.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:4,sig:4qnpu2
 * @lastUpdated 2026-06-23T23:27:58.408Z
 */

import { TenantAwareRepository } from './TenantAwareRepository';
import AssetSpaceLink, { type IAssetSpaceLink } from '@/models/AssetSpaceLink';
import type { QueryFilter } from 'mongoose';
import mongoose from 'mongoose';

export class AssetSpaceLinkRepository extends TenantAwareRepository<IAssetSpaceLink> {
  constructor() {
    super(AssetSpaceLink);
  }

  /**
   * Obtiene todos los enlaces de un asset
   */
  async findByAssetId(tenantId: string, assetId: string): Promise<IAssetSpaceLink[]> {
    return await this.find({ tenantId, assetId } as QueryFilter<IAssetSpaceLink>);
  }

  /**
   * Obtiene todos los assets vinculados a un espacio
   */
  async findBySpaceId(tenantId: string, spaceId: string): Promise<IAssetSpaceLink[]> {
    return await this.find({ tenantId, spaceId } as QueryFilter<IAssetSpaceLink>);
  }

  /**
   * Obtiene el enlace primario de un asset
   */
  async findPrimaryLink(tenantId: string, assetId: string): Promise<IAssetSpaceLink | null> {
    return await this.findOne({ tenantId, assetId, isPrimary: true } as QueryFilter<IAssetSpaceLink>);
  }

  /**
   * Actualiza en cascada el path de los enlaces asociados a un espacio
   */
  async updateSpacePaths(tenantId: string, spaceId: string, newPath: string, session?: mongoose.ClientSession): Promise<unknown> {
    const filter = { tenantId, spaceId };
    const update = { $set: { spacePath: newPath } };
    const options = session ? { session } : {};
    return await this.model.updateMany(filter, update, options).exec();
  }
}
