/**
 * @purpose Gestiona consultas de bases de datos para repositorios conscientes de inquilinos aplicando filtros de seguridad según el rol del usuario y el ID de inquilino.
 * @purpose_en Manages database queries for tenant-aware repositories by applying security filters based on the user's role and tenant ID.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:0,imports:4,sig:7spun1
 * @lastUpdated 2026-06-23T21:47:29.835Z
 */

import { Document } from 'mongoose';
import type { QueryFilter } from 'mongoose';
import { BaseRepository } from './BaseRepository';
import type { FederatedSession } from '@ajabadia/satellite-sdk';

export abstract class TenantAwareRepository<T extends Document> extends BaseRepository<T> {
  
  protected applySecurityFilter(session: FederatedSession, filter: QueryFilter<T> = {}): QueryFilter<T> {
    if (!session.authenticated || !session.user) {
      throw new Error('UNAUTHORIZED_ECOSYSTEM_ACCESS');
    }
    
    // Si el rol es SUPER_ADMIN, puede ver datos globales sin restricción de tenant
    if (session.user.role === 'SUPER_ADMIN') {
      return filter;
    }
    
    // Para cualquier otro rol, filtramos estrictamente por tenantId de la sesión
    return {
      ...filter,
      tenantId: session.user.tenantId
    } as QueryFilter<T>;
  }

  async listForSession(session: FederatedSession, filter: QueryFilter<T> = {}): Promise<T[]> {
    const securityFilter = this.applySecurityFilter(session, filter);
    return this.find(securityFilter);
  }

  async findOneForSession(session: FederatedSession, filter: QueryFilter<T>): Promise<T | null> {
    const securityFilter = this.applySecurityFilter(session, filter);
    return this.findOne(securityFilter);
  }
}

