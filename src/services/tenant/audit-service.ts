import { connectLogsDB } from '@/lib/database/mongodb-logs';
import { getAuditLogModel, IAuditLog } from '@/models/AuditLog';
import { LogsClient } from '@/lib/logs-client';

export class AuditService {
  /**
   * Registra un evento de auditoría de manera Fail-Safe usando LogsClient
   * (asíncrona y desacoplada del acceso directo a la base de datos para escrituras).
   */
  static async logEvent(params: IAuditLog): Promise<void> {
    try {
      await LogsClient.log({
        tenantId: params.tenantId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        userId: params.userId,
        userEmail: params.userEmail,
        changedFields: params.changedFields || {},
        previousState: params.previousState,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
      console.log(`[AUDIT_SAAS_LOG] Sent ${params.action} event to central service successfully.`);
    } catch (err) {
      // 🛡️ Enfoque Fail-Safe: Evitar bloquear transacciones si el microservicio de logs está inaccesible
      console.error('[AUDIT_SAAS_ERROR] Fail-safe active. Logs client failed:', err);
    }
  }

  /**
   * Obtiene la cronología unificada de logs de la colección central de auditoría remota
   */
  static async getCombinedLogsByTenant(tenantId: string, limit = 50): Promise<IAuditLog[]> {
    try {
      const logsConn = await connectLogsDB();
      const AuditModel = getAuditLogModel(logsConn);

      const logs = await AuditModel.find({ tenantId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();

      return logs.map(doc => {
        const obj = doc.toObject();
        if (obj._id) obj._id = obj._id.toString();
        return obj as IAuditLog;
      });
    } catch (err) {
      console.error('[AUDIT_SAAS_READ_ERROR] Failed to query remote logs database:', err);
      return [];
    }
  }
}
