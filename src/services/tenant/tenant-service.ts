import { TenantSchema, type Tenant } from '@/lib/schemas/tenant';
import { TenantRepository } from '@/lib/repositories/TenantRepository';
import { SecurityService } from '@/lib/security';
import { AuditService } from './audit-service';

const tenantRepository = new TenantRepository();

export class TenantService {
  private static cache = new Map<string, { data: Tenant; timestamp: number }>();
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutos de tiempo de vida

  /**
   * Obtiene la configuración de un tenant mediante su ID, aplicando caché en memoria
   */
  static async getConfig(tenantId: string): Promise<Tenant> {
    // 1. Consultar caché
    const cached = this.cache.get(tenantId);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
      return cached.data;
    }

    // 2. Consultar base de datos
    const tenantDoc = await tenantRepository.findByTenantId(tenantId);
    if (!tenantDoc) {
      throw new Error(`Configuración de tenant no encontrada para ID: ${tenantId}`);
    }

    // Convertir a objeto plano y validar
    const rawData = tenantDoc.toObject ? tenantDoc.toObject() : tenantDoc;
    const validated = TenantSchema.parse(rawData);

    // 3. Descifrar datos sensibles
    if (validated.billing?.taxId) {
      validated.billing.taxId = SecurityService.decrypt(validated.billing.taxId);
    }

    // 4. Actualizar caché y retornar
    this.cache.set(tenantId, { data: validated, timestamp: Date.now() });
    return validated;
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

    const updateData = { ...data };

    // Cifrar campos sensibles si se están actualizando
    if (updateData.billing) {
      const billing = { ...updateData.billing };
      if (billing.taxId) {
        billing.taxId = SecurityService.encrypt(billing.taxId);
      }
      updateData.billing = billing;
    }

    // Realizar actualización
    const updatedDoc = await tenantRepository.model.findOneAndUpdate(
      { tenantId },
      { 
        $set: { 
          ...updateData,
          updatedAt: new Date()
        } 
      },
      { new: true }
    ).exec();

    if (!updatedDoc) {
      throw new Error(`Fallo al actualizar el tenant con ID: ${tenantId}`);
    }

    // Registrar en auditoría de consola e inmutable de logs remotos
    console.log(`[AUDIT] [UPDATE_TENANT_CONFIG] Tenant: ${tenantId} | PerformedBy: ${performedBy} | Time: ${new Date().toISOString()}`);
    
    // Obtener delta limpio de auditoría
    const changedFields = { ...updateData };
    const prevObj = previousState.toObject();

    // 🛡️ Ocultar datos altamente confidenciales del feed de auditoría
    if (changedFields.billing?.taxId) {
      changedFields.billing = { ...changedFields.billing, taxId: '[ENCRYPTED_DATA]' };
    }
    if (prevObj.billing?.taxId) {
      prevObj.billing = { ...prevObj.billing, taxId: '[ENCRYPTED_DATA]' };
    }

    // Determine the most accurate audit action name
    let auditAction = 'UPDATE_TENANT_CONFIG';
    if ('allowedApps' in updateData) {
      auditAction = 'UPDATE_TENANT_LICENSING';
    } else if ('branding' in updateData) {
      auditAction = 'UPDATE_BRANDING';
    }

    // Disparar log de auditoría remota de forma asíncrona
    AuditService.logEvent({
      tenantId,
      action: auditAction,
      entityType: 'TENANT',
      entityId: previousState._id.toString(),
      userId: performedBy,
      userEmail: performedBy,
      changedFields,
      previousState: prevObj
    });
    
    // Purgar caché
    this.cache.delete(tenantId);

    // Validar y retornar
    const validated = TenantSchema.parse(updatedDoc.toObject());
    if (validated.billing?.taxId) {
      validated.billing.taxId = SecurityService.decrypt(validated.billing.taxId);
    }
    return validated;
  }

  static async getAllTenants(): Promise<Tenant[]> {
    const list = await tenantRepository.find({});
    
    // Aggregar el conteo de espacios por tenant
    let countsMap: Record<string, number> = {};
    try {
      const Space = (await import('@/models/Space')).default;
      const spaceCounts = await Space.aggregate([
        { $group: { _id: '$tenantId', count: { $sum: 1 } } }
      ]);
      countsMap = Object.fromEntries(spaceCounts.map(item => [item._id, item.count]));
    } catch (err) {
      console.error('[TenantService] Failed to aggregate space counts:', err);
    }

    return list.map(doc => {
      const validated = TenantSchema.parse(doc.toObject());
      if (validated.billing?.taxId) {
        validated.billing.taxId = SecurityService.decrypt(validated.billing.taxId);
      }
      validated.spaceCount = countsMap[validated.tenantId] || 0;
      return validated;
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

    const insertData = { ...validated };

    if (insertData.billing) {
      const billing = { ...insertData.billing };
      if (billing.taxId) {
        billing.taxId = SecurityService.encrypt(billing.taxId);
      }
      insertData.billing = billing;
    }

    const createdDoc = await tenantRepository.create(insertData as unknown as Parameters<typeof tenantRepository.create>[0]);

    console.log(`[AUDIT] [CREATE_TENANT] Tenant: ${validated.tenantId} | PerformedBy: ${performedBy} | Time: ${new Date().toISOString()}`);

    // Registrar auditoría remota SaaS
    const auditFields = { ...validated };
    if (auditFields.billing?.taxId) {
      auditFields.billing = { ...auditFields.billing, taxId: '[ENCRYPTED_DATA]' };
    }

    AuditService.logEvent({
      tenantId: validated.tenantId,
      action: 'CREATE_TENANT',
      entityType: 'TENANT',
      entityId: createdDoc._id.toString(),
      userId: performedBy,
      userEmail: performedBy,
      changedFields: auditFields
    });

    const result = TenantSchema.parse(createdDoc.toObject());
    if (result.billing?.taxId) {
      result.billing.taxId = SecurityService.decrypt(result.billing.taxId);
    }
    return result;
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

    console.log(`[AUDIT] [DELETE_TENANT] ID: ${id} | TenantId: ${updatedDoc.tenantId} | PerformedBy: ${performedBy} | Time: ${new Date().toISOString()}`);

    // Registrar auditoría remota SaaS
    AuditService.logEvent({
      tenantId: updatedDoc.tenantId,
      action: 'DELETE_TENANT',
      entityType: 'TENANT',
      entityId: id,
      userId: performedBy,
      userEmail: performedBy,
      changedFields: { active: false }
    });

    // Purgar de la caché en memoria
    this.cache.delete(updatedDoc.tenantId);
  }
}
