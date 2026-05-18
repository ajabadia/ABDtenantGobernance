import { connectLogsDB } from '@/lib/database/mongodb-logs';
import { getBrandingAuditModel, getSpaceAuditModel, IAuditLog } from '@/models/AuditLog';

export class AuditService {
  /**
   * Registra un evento de auditoría en la colección dedicada del clúster de logs
   * de manera Fail-Safe (asíncrona y tolerante a fallas de red).
   */
  static async logEvent(params: IAuditLog): Promise<void> {
    try {
      const logsConn = await connectLogsDB();
      
      const isBrandingOp = [
        'UPDATE_BRANDING', 
        'CREATE_TENANT', 
        'DELETE_TENANT'
      ].includes(params.action);

      if (isBrandingOp) {
        const Model = getBrandingAuditModel(logsConn);
        await Model.create(params);
      } else {
        const Model = getSpaceAuditModel(logsConn);
        await Model.create(params);
      }
      
      console.log(`[AUDIT_SAAS_LOG] Persisted ${params.action} event successfully.`);
    } catch (err) {
      // 🛡️ Enfoque Fail-Safe: Evitar bloquear transacciones si el clúster de logs está inaccesible
      console.error('[AUDIT_SAAS_ERROR] Fail-safe active. Logs cluster failed:', err);
    }
  }

  /**
   * Obtiene la cronología unificada de logs de ambas colecciones de auditoría remota
   */
  static async getCombinedLogsByTenant(tenantId: string, limit = 50): Promise<IAuditLog[]> {
    try {
      const logsConn = await connectLogsDB();
      const BrandingModel = getBrandingAuditModel(logsConn);
      const SpaceModel = getSpaceAuditModel(logsConn);

      const [brandingLogs, spaceLogs] = await Promise.all([
        BrandingModel.find({ tenantId }).sort({ createdAt: -1 }).limit(limit).exec(),
        SpaceModel.find({ tenantId }).sort({ createdAt: -1 }).limit(limit).exec()
      ]);

      // Unificar deltas y ordenar cronológicamente
      const combined = [...brandingLogs, ...spaceLogs]
        .map(doc => {
          const obj = doc.toObject();
          if (obj._id) obj._id = obj._id.toString();
          return obj as unknown as IAuditLog;
        })
        .sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });

      return combined.slice(0, limit);
    } catch (err) {
      console.error('[AUDIT_SAAS_READ_ERROR] Failed to query remote logs database:', err);
      return [];
    }
  }
}
