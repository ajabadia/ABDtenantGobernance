import { Document } from 'mongoose';
import type { QueryFilter } from 'mongoose';
import { BaseRepository } from './BaseRepository';
import { FederatedSession } from '@/lib/session';

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

