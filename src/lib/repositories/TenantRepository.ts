/**
 * @purpose Gestiona datos de inquilinos y operaciones como encontrar un inquilino por ID y actualizar el branding.
 * @purpose_en Manages tenant data and operations such as finding a tenant by ID and updating branding.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:kl1kmy
 * @lastUpdated 2026-06-23T23:28:12.565Z
 */

import { BaseRepository } from './BaseRepository';
import Tenant, { type ITenant, type ITenantBranding } from '@/models/Tenant';
import type { QueryFilter } from 'mongoose';

export class TenantRepository extends BaseRepository<ITenant> {
  constructor() {
    super(Tenant);
  }

  /**
   * Busca una organización por su identificador exclusivo
   */
  async findByTenantId(tenantId: string): Promise<ITenant | null> {
    return await this.findOne({ tenantId } as QueryFilter<ITenant>);
  }

  /**
   * Actualiza atómicamente la marca visual (branding) del tenant
   */
  async updateBranding(tenantId: string, brandingData: ITenantBranding): Promise<ITenant | null> {
    return await this.model.findOneAndUpdate(
      { tenantId },
      { $set: { branding: brandingData } },
      { new: true }
    ).exec();
  }
}
