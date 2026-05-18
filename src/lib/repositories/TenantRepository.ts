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
