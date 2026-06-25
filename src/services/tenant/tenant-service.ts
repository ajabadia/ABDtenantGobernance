/**
 * @purpose Gestiona configuraciones de inquilinos, incluyendo recuperación, actualización y eliminación.
 * @purpose_en Manages tenant configurations, including retrieval, update, and deletion.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:1,imports:6,sig:zj0ty9
 * @lastUpdated 2026-06-23T23:29:18.984Z
 */

import { TenantSchema, type Tenant } from '@/lib/schemas/tenant';
import { TenantRepository } from '@/lib/repositories/TenantRepository';
import { AuditService } from './audit-service';
import { TenantConfigCache } from './TenantConfigCache';
import { encryptBillingFields, decryptBillingFields, maskBillingForAudit } from './tenant-billing-helper';
import Space from '@/models/Space';

const tenantRepository = new TenantRepository();

export class TenantService {
  /**
   * Obtiene la configuración de un tenant mediante su ID, aplicando caché en memoria
   */
  static async getConfig(tenantId: string): Promise<Tenant> {
    const cached = TenantConfigCache.get<Tenant>(tenantId);
    if (cached) return cached;

    const tenantDoc = await tenantRepository.findByTenantId(tenantId);
    if (!tenantDoc) {
      throw new Error(`Configuración de tenant no encontrada para ID: ${tenantId}`);
    }

    const rawData = tenantDoc.toObject ? tenantDoc.toObject() : tenantDoc;
    const validated = TenantSchema.parse(rawData);
    const result = decryptBillingFields(validated);

    TenantConfigCache.set(tenantId, result);
    return result;
  }

  /**
   * Actualiza la configuración de un tenant y purga su caché
   */
  static async updateConfig(
    tenantId: string,
    data: Partial<Tenant>,
    performedBy: string = 'SYSTEM'
  ): Promise<Tenant> {
    const previousState = await tenantRepository.findByTenantId(tenantId);
    if (!previousState) {
      throw new Error(`El tenant no existe para ID: ${tenantId}`);
    }

    const updateData = encryptBillingFields({ ...data });

    const updatedDoc = await tenantRepository.model.findOneAndUpdate(
      { tenantId },
      { $set: { ...updateData, updatedAt: new Date() } },
      { new: true }
    ).exec();

    if (!updatedDoc) {
      throw new Error(`Fallo al actualizar el tenant con ID: ${tenantId}`);
    }

    const prevObj = previousState.toObject();

    let auditAction = 'UPDATE_TENANT_CONFIG';
    if ('allowedApps' in updateData) {
      auditAction = 'UPDATE_TENANT_LICENSING';
    } else if ('branding' in updateData) {
      auditAction = 'UPDATE_BRANDING';
    }

    AuditService.logEvent({
      tenantId,
      action: auditAction,
      entityType: 'TENANT',
      entityId: previousState._id.toString(),
      userId: performedBy,
      userEmail: performedBy,
      changedFields: maskBillingForAudit(updateData as { billing?: { taxId?: string } }) || updateData,
      previousState: maskBillingForAudit(prevObj as { billing?: { taxId?: string } }) || prevObj
    });
    
    TenantConfigCache.delete(tenantId);

    const validated = TenantSchema.parse(updatedDoc.toObject());
    return decryptBillingFields(validated);
  }

  static async getAllTenants(): Promise<Tenant[]> {
    const list = await tenantRepository.find({});

    // Aggregate active space counts per tenant
    const spaceCounts = await Space.aggregate<{ _id: string; count: number }>([
      { $match: { isActive: true } },
      { $group: { _id: '$tenantId', count: { $sum: 1 } } },
    ]);
    const spaceCountMap = new Map(spaceCounts.map(s => [s._id, s.count]));

    return list.map(doc => {
      const validated = TenantSchema.parse(doc.toObject());
      const result = decryptBillingFields(validated);
      result.spaceCount = spaceCountMap.get(result.tenantId) ?? 0;
      return result;
    });
  }

  /**
   * Crea un nuevo tenant en el sistema con validación, encriptación y auditoría
   */
  static async createTenant(data: Partial<Tenant>, performedBy: string = 'SYSTEM'): Promise<Tenant> {
    const validated = TenantSchema.parse(data);

    // Verificar si ya existe un tenant con el mismo tenantId
    const existing = await tenantRepository.findByTenantId(validated.tenantId);
    if (existing) {
      throw new Error(`El ID del Tenant '${validated.tenantId}' ya está registrado.`);
    }

    const insertData = encryptBillingFields({ ...validated });

    const createdDoc = await tenantRepository.create(insertData as Parameters<typeof tenantRepository.create>[0]);

    AuditService.logEvent({
      tenantId: validated.tenantId,
      action: 'CREATE_TENANT',
      entityType: 'TENANT',
      entityId: createdDoc._id.toString(),
      userId: performedBy,
      userEmail: performedBy,
      changedFields: maskBillingForAudit(validated as { billing?: { taxId?: string } }) || validated
    });

    const result = TenantSchema.parse(createdDoc.toObject());
    return decryptBillingFields(result);
  }

  /**
   * Desactiva lógicamente un tenant (soft-delete)
   */
  static async deleteTenant(id: string, performedBy: string = 'SYSTEM'): Promise<void> {
    const updatedDoc = await tenantRepository.update(id, { 
      $set: { active: false } 
    });

    if (!updatedDoc) {
      throw new Error(`Tenant con ID ${id} no encontrado.`);
    }

    const auditFields = { isActive: false };

    AuditService.logEvent({
      tenantId: updatedDoc.tenantId,
      action: 'DELETE_TENANT',
      entityType: 'TENANT',
      entityId: id,
      userId: performedBy,
      userEmail: performedBy,
      changedFields: { active: false }
    });

    TenantConfigCache.delete(updatedDoc.tenantId);
  }

  /**
   * Purgado físico del tenant (Hard delete / GDPR Purge) con llamadas en cascada S2S a los satélites
   */
  static async purgeTenant(id: string, performedBy: string = 'SYSTEM'): Promise<void> {
    const tenantDoc = await tenantRepository.model.findById(id).exec();
    if (!tenantDoc) {
      throw new Error(`Tenant con ID de base de datos ${id} no encontrado.`);
    }

    const { tenantId, dbPrefix, isolationStrategy } = tenantDoc;

    // 1. Orquestación S2S a los satélites
    const satellites = [
      { name: 'Quiz', url: process.env.QUIZ_SERVICE_URL || 'http://localhost:5020' },
      { name: 'Files', url: process.env.FILES_SERVICE_URL || 'http://localhost:5005' },
      { name: 'Logs', url: process.env.LOGS_SERVICE_URL ? new URL(process.env.LOGS_SERVICE_URL).origin : 'http://localhost:5003' }
    ];

    for (const sat of satellites) {
      try {
        console.log(`[GDPR_PURGE_S2S] Calling purge on ${sat.name} satellite for tenant ${tenantId}...`);
        const response = await fetch(`${sat.url}/api/internal/gdpr/purge`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ABD_INTERNAL_SECRET || 'dev-internal-secret-key-2026'}`
          },
          body: JSON.stringify({ tenantId, dbPrefix, isolationStrategy }),
          // Add timeout to prevent blocking during build checks or offline testing
          signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) {
          const bodyText = await response.text();
          console.warn(`[GDPR_PURGE_S2S_WARN] Satellite ${sat.name} purge failed:`, bodyText);
        } else {
          console.log(`[GDPR_PURGE_S2S_OK] Satellite ${sat.name} purged successfully.`);
        }
      } catch (err) {
        console.warn(`[GDPR_PURGE_S2S_ERR] Failed to communicate with ${sat.name} satellite:`, err instanceof Error ? err.message : err);
      }
    }

    // 2. Eliminar físicamente los registros locales del inquilino
    await tenantRepository.model.findByIdAndDelete(id).exec();

    // 3. Registrar el evento de auditoría en la central
    AuditService.logEvent({
      tenantId,
      action: 'PURGE_TENANT',
      entityType: 'TENANT',
      entityId: id,
      userId: performedBy,
      userEmail: performedBy,
      changedFields: { purged: true }
    });

    TenantConfigCache.delete(tenantId);
  }
}
